import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.amp import GradScaler, autocast  # FP16 mixed precision (PyTorch 2.x API)
import contextlib
from transformers import AutoModel
from prepare_data import train_dataset, val_dataset, NUM_LABELS, label_names
from tqdm import tqdm

# =============================================================================
# 1. HYPERPARAMETERS & CONFIGURATION
# =============================================================================
DEVICE     = "cuda" if torch.cuda.is_available() else "cpu"
BATCH_SIZE = 8       # Number of sentences processed at once
GRAD_ACCUM = 4       # Wait for 4 batches before updating weights (simulates BATCH_SIZE=32)
EPOCHS     = 4      
LR         = 1e-5    # Learning rate
SAVE_PATH  = "emotion_model_deberta.pt" 

print(f"Using device: {DEVICE}")
if DEVICE == "cuda":
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

# =============================================================================
# 2. AI MODEL ARCHITECTURE
# =============================================================================
# this is the actual neural network architecture for emotion detection
# it loads a pretrained deberta-v3-base model as the backbone, adds dropout to reduce overfitting,
# and slaps a linear layer on top that maps the 768-dim hidden state to 28 emotion scores
class EmotionModel(nn.Module):
    """
    DeBERTa-v3-base backbone + Dropout + Linear classifier.
    - DeBERTa: 184M pre-trained parameters with disentangled attention.
    - Dropout(0.3): Randomly zeros 30% of the hidden layer during training.
      This prevents overfitting on rare emotions.
    - Linear(768, 28): Maps DeBERTa's 768-dim [CLS] vector to 28 emotion scores.
    """
    # sets up the three layers: deberta backbone, dropout for regularization, and the final classifier head
    def __init__(self):
        super().__init__()
        self.bert = AutoModel.from_pretrained("microsoft/deberta-v3-base", use_safetensors=True, torch_dtype=torch.float32)
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(768, NUM_LABELS)

    # runs a forward pass through the model. takes tokenized input, passes it through deberta,
    # grabs the [CLS] token output (first token), applies dropout, then runs it through
    # the classifier to get 28 raw scores (logits) one for each emotion
    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        # DeBERTa-v3 uses a different pooling but [CLS] is still at position 0
        cls_output = outputs.last_hidden_state[:, 0, :].float()  # DeBERTa may output fp16 internally; cast to fp32 for classifier
        cls_output = self.dropout(cls_output)
        logits = self.classifier(cls_output)
        return logits


# =============================================================================
# 3. TRAINING SETUP & RESUME LOGIC
# =============================================================================
model = EmotionModel().to(DEVICE)

# --- NEW: Resume Training Logic ---
# If a previous save file exists, load it so we don't start from zero
if os.path.exists(SAVE_PATH):
    print(f"\n🔄 Found existing weights at '{SAVE_PATH}'!")
    print("Resuming training from this checkpoint...")
    model.load_state_dict(torch.load(SAVE_PATH, map_location=DEVICE, weights_only=True))
else:
    print(f"\n🆕 No existing weights found at '{SAVE_PATH}'. Starting fresh!")

# The Optimizer: This algorithm (AdamW) updates the weights based on the errors it makes
optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=0.01)

# =============================================================================
# 4. HANDLING CLASS IMBALANCE (Dampened Weights)
# =============================================================================
# We use Square Root dampening to prevent extreme penalties (like 562x).
# This keeps the model stable while still addressing the neutral imbalance.
print("Computing dampened class weights from training data...")
from prepare_data import dataset
raw_train = dataset["train"]
N = len(raw_train)
counts = torch.zeros(NUM_LABELS)
for row in raw_train:
    for lbl in row["labels"]:
        counts[lbl] += 1

# Dampened formula: sqrt(neg / pos)
pos_weight = torch.sqrt((N - counts) / counts).to(DEVICE)
print(f"  neutral weight : {pos_weight[label_names.index('neutral')]:.2f}  (low = common)")
print(f"  grief   weight : {pos_weight[label_names.index('grief')]:.2f}  (balanced = rare)")

# BCEWithLogitsLoss with pos_weight: each emotion gets its own scale penalty.
loss_fn = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

# GradScaler enables FP16. It scales the loss up to prevent underflow,
# then unscales before the optimizer step. This halves VRAM usage.
# GradScaler only works with CUDA; use a dummy context on CPU
scaler = GradScaler(DEVICE) if DEVICE == "cuda" else None

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0)
val_loader   = DataLoader(val_dataset,   batch_size=BATCH_SIZE, shuffle=False, num_workers=0)


# =============================================================================
# 5. VALIDATION HELPER FUNCTION
# =============================================================================
# runs the model on the validation set without updating any weights
# basically just loops through all batches, computes the loss, and averages it
# we call this after each epoch to check if the model is actually getting better or just memorizing
def evaluate(loader):
    """Computes validation loss. Called after each training epoch."""
    model.eval()
    total_loss = 0.0
    with torch.no_grad():
        for batch in loader:
            input_ids      = batch["input_ids"].to(DEVICE)
            attention_mask = batch["attention_mask"].to(DEVICE)
            labels         = batch["labels"].to(DEVICE)
            logits = model(input_ids, attention_mask)
            total_loss += loss_fn(logits, labels).item()
    return total_loss / len(loader)


# =============================================================================
# 6. MAIN TRAINING LOOP
# =============================================================================
best_val_loss = float("inf")
print("\nStarting training...\n")

for epoch in range(EPOCHS):
    model.train()
    total_train_loss = 0.0

    loop = tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS}", leave=True)

    for step, batch in enumerate(loop):
        input_ids      = batch["input_ids"].to(DEVICE)
        attention_mask = batch["attention_mask"].to(DEVICE)
        labels         = batch["labels"].to(DEVICE)

        # 1. Forward pass with autocast (FP16 on CUDA, no-op on CPU)
        # device_type= is required as keyword arg in PyTorch 2.x
        amp_ctx = autocast(device_type=DEVICE) if DEVICE == "cuda" else contextlib.nullcontext()
        with amp_ctx:
            logits = model(input_ids, attention_mask)
            # Scale the loss so the average across 4 steps is correct
            loss = loss_fn(logits, labels) / GRAD_ACCUM

        # 2. Backward pass
        if scaler:
            scaler.scale(loss).backward()
        else:
            loss.backward()

        # 3. Update weights ONLY every GRAD_ACCUM steps
        if (step + 1) % GRAD_ACCUM == 0:
            if scaler:
                scaler.step(optimizer)
                scaler.update()
            else:
                optimizer.step()
            optimizer.zero_grad()

        # Keep track of loss for the progress bar (multiply back by GRAD_ACCUM for true scale)
        total_train_loss += loss.item() * GRAD_ACCUM
        loop.set_postfix(loss=f"{total_train_loss / (step + 1):.4f}")

    avg_train_loss = total_train_loss / len(train_loader)
    avg_val_loss   = evaluate(val_loader)

    print(f"\n  Epoch {epoch+1} Summary:")
    print(f"    Train Loss: {avg_train_loss:.4f}")
    print(f"    Val   Loss: {avg_val_loss:.4f}")

    # Save best model (based on lowest validation loss)
    if avg_val_loss < best_val_loss:
        best_val_loss = avg_val_loss
        torch.save(model.state_dict(), SAVE_PATH)
        print(f"    ✅ Best model saved to '{SAVE_PATH}' (val_loss={best_val_loss:.4f})")
    print()

print("Training complete!")
print(f"Best validation loss: {best_val_loss:.4f}")
