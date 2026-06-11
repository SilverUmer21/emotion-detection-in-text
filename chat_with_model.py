import torch
import torch.nn as nn
import os
from transformers import AutoModel, AutoTokenizer

# =============================================================================
# 1. EMOTION LABELS
# =============================================================================
# The 28 emotions our model knows. This list matches the exact order of the
# GoEmotions dataset labels. Our AI model will output 28 numbers, and this
# list tells us which number corresponds to which emotion.
label_names = [
    'admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring', 
    'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval', 
    'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief', 
    'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization', 
    'relief', 'remorse', 'sadness', 'surprise', 'neutral'
]
NUM_LABELS = len(label_names)

# Automatically use GPU (CUDA) if available, otherwise fallback to CPU
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# =============================================================================
# 2. AI MODEL ARCHITECTURE
# =============================================================================
# This defines the "Brain" of our AI. It must match exactly how we built it
# in train.py so we can successfully load the saved weights.
class EmotionModel(nn.Module):
    def __init__(self):
        super().__init__()
        # Step A: The Backbone
        # We use DeBERTa-v3-base. It has already read millions of texts and 
        # understands language context using "Disentangled Attention".
        self.bert = AutoModel.from_pretrained("microsoft/deberta-v3-base", use_safetensors=True, torch_dtype=torch.float32)
        
        # Step B: Regularization
        # Dropout prevents the model from relying too heavily on specific neurons.
        self.dropout = nn.Dropout(0.3)
        
        # Step C: The Classifier Head
        # This takes the 768-dimensional context vector from DeBERTa and 
        # maps it down to our 28 specific emotion categories.
        self.classifier = nn.Linear(768, NUM_LABELS)

    def forward(self, input_ids, attention_mask):
        # 1. Pass the raw text IDs into DeBERTa
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        # 2. Extract the [CLS] token (position 0), which contains the 
        #    summary of the entire sentence's meaning.
        cls_output = outputs.last_hidden_state[:, 0, :]
        cls_output = self.dropout(cls_output)
        # 3. Pass the summary through our custom classifier layer
        return self.classifier(cls_output)

# =============================================================================
# 3. SYSTEM INITIALIZATION
# =============================================================================
def load_system():
    """Loads the Tokenizer and the Trained Neural Network from disk."""
    import warnings
    warnings.filterwarnings("ignore", category=FutureWarning)
    
    print("\nLoading tokenizer and AI model (this takes a few seconds)...")
    
    # The tokenizer converts words into numerical IDs
    tokenizer = AutoTokenizer.from_pretrained("microsoft/deberta-v3-base", use_safetensors=True)
    
    # Initialize the blank model architecture
    model = EmotionModel().to(DEVICE)
    
    # Load our trained "brain" (the weights saved after training)
    model_path = "emotion_model_deberta.pt"
    if os.path.exists(model_path):
        print(f"Loading trained weights from '{model_path}'...")
        model.load_state_dict(torch.load(model_path, map_location=DEVICE, weights_only=True))
    else:
        print(f"⚠️ Warning: '{model_path}' not found! The AI is predicting randomly. Please run train.py first.")
        
    # Put model in evaluation mode (turns off training features like Dropout)
    model.eval()
    
    print("\n✅ System Ready! Running on:", DEVICE.upper())
    return model, tokenizer

# =============================================================================
# 4. PREDICTION LOGIC
# =============================================================================
def predict(model, tokenizer, text: str):
    """Predicts emotions for a given text string."""
    
    # Step 1: Tokenize the input text
    # This turns sentences like "I am happy" into numerical IDs like [12, 432, 89]
    enc = tokenizer(
        text, max_length=128,
        padding="max_length",
        truncation=True,
        return_tensors="pt" # Return PyTorch format
    )
    
    # Step 2: Pass through the model
    # torch.no_grad() tells PyTorch we aren't training, which saves memory
    with torch.no_grad():
        logits = model(
            enc["input_ids"].to(DEVICE),
            enc["attention_mask"].to(DEVICE)
        )
        
    # Step 3: Convert raw scores (logits) into probabilities (0 to 1) using Sigmoid
    probs = torch.sigmoid(logits).squeeze().cpu().numpy()
    
    # Step 4: Filter out low-confidence predictions
    # A threshold of 0.3 means we only show emotions the AI is >30% sure about
    detected = [
        (label_names[i], float(probs[i]))
        for i in range(NUM_LABELS)
        if probs[i] > 0.3 
    ]
    
    return detected

# =============================================================================
# 5. COMMAND LINE INTERFACE (CLI)
# =============================================================================
def main():
    """Main loop for the interactive chat terminal."""
    print("=" * 60)
    print("      GoEmotions: Interactive Emotion Detector      ")
    print("=" * 60)
    
    try:
        model, tokenizer = load_system()
    except Exception as e:
        print("\n❌ Error loading model! Did you run train.py first?")
        print(e)
        return

    print("\nType your sentence below to detect its emotions.")
    print("Type 'exit' or 'quit' to close the program.")
    print("-" * 60)

    # Infinite loop to keep asking for user input
    while True:
        try:
            text = input("\n📝 You: ")
        except (KeyboardInterrupt, EOFError):
            break
            
        if text.strip().lower() in ['exit', 'quit']:
            print("Goodbye!")
            break
            
        if not text.strip():
            continue
            
        # Get AI predictions
        detected = predict(model, tokenizer, text)
        
        # Display the results with a visual confidence bar chart
        if detected:
            print("   Detected emotions:")
            for emotion, confidence in sorted(detected, key=lambda x: -x[1]):
                bar = "█" * int(confidence * 20)
                print(f"   {emotion:<20} {confidence:.1%}  {bar}")
        else:
            print("   No strong emotion detected (likely neutral)")

if __name__ == "__main__":
    main()

