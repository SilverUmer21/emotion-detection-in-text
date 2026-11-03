# file: evaluate.py
import torch
import torch.nn as nn
import numpy as np
from torch.utils.data import DataLoader
from sklearn.metrics import f1_score, hamming_loss, classification_report
from transformers import AutoModel, AutoTokenizer
from prepare_data import test_dataset, label_names, NUM_LABELS

# Automatically use GPU (CUDA) if available, otherwise fallback to CPU
DEVICE    = "cuda" if torch.cuda.is_available() else "cpu"

# The probability threshold. If the AI is >50% confident, we flag the emotion.
THRESHOLD = 0.5
# =============================================================================
# 1. AI MODEL ARCHITECTURE
# =============================================================================
# This defines the "Brain" of our AI. It must match exactly how we built it
# in train.py so we can successfully load the saved weights.
class EmotionModel(nn.Module):
    def __init__(self):
        super().__init__()
        # DeBERTa backbone for understanding language context
        self.bert       = AutoModel.from_pretrained("microsoft/deberta-v3-base", use_safetensors=True, torch_dtype=torch.float32)
        # Dropout for regularization (preventing overfitting)
        self.dropout    = nn.Dropout(0.3)
        # Linear layer mapping 768 DeBERTa features to 28 emotion scores
        self.classifier = nn.Linear(768, NUM_LABELS)

    def forward(self, input_ids, attention_mask):
        outputs    = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        # Extract the [CLS] token (position 0) which contains the sentence summary
        cls_output = outputs.last_hidden_state[:, 0, :]
        cls_output = self.dropout(cls_output)
        return self.classifier(cls_output)

# =============================================================================
# 2. SYSTEM INITIALIZATION
# =============================================================================
print(f"Using device: {DEVICE}")
print("Loading saved model from 'emotion_model_deberta.pt'...")
model = EmotionModel().to(DEVICE)
# Load the pre-trained weights from disk into our model architecture
model.load_state_dict(torch.load("emotion_model_deberta.pt", map_location=DEVICE, weights_only=True))
model.eval() # Turn off training features (like dropout)
print("Model loaded.\n")

# =============================================================================
# 3. FULL DATASET EVALUATION (Generate Metrics for Report)
# =============================================================================
# We load the "test" portion of our dataset. The model has NEVER seen this data
# during training, so it provides an unbiased measure of accuracy.
test_loader = DataLoader(test_dataset, batch_size=32)
all_preds, all_labels = [], []

print("Evaluating on test set...")
# torch.no_grad() tells PyTorch we aren't training, saving memory and time
with torch.no_grad():
    for batch in test_loader:
        input_ids      = batch["input_ids"].to(DEVICE)
        attention_mask = batch["attention_mask"].to(DEVICE)
        labels         = batch["labels"].numpy() # Actual correct answers

        # Get raw AI predictions
        logits = model(input_ids, attention_mask)
        
        # Convert raw scores to probabilities between 0 and 1 using Sigmoid
        probs  = torch.sigmoid(logits).cpu().numpy()  
        
        # Threshold: if probability > 0.5, predict '1' (emotion present), else '0'
        preds  = (probs > THRESHOLD).astype(int)      

        all_preds.append(preds)
        all_labels.append(labels)

all_preds  = np.vstack(all_preds)
all_labels = np.vstack(all_labels)

# =============================================================================
# 4. METRICS CALCULATION
# =============================================================================
# Micro F1: Calculates total true positives, false negatives and false positives globally.
micro_f1   = f1_score(all_labels, all_preds, average="micro",  zero_division=0)

# Macro F1: Calculates F1 for each label, and finds their unweighted mean. 
# This treats rare emotions (like grief) equally to common ones (like neutral).
macro_f1   = f1_score(all_labels, all_preds, average="macro",  zero_division=0)

# Hamming Loss: The fraction of labels that are incorrectly predicted.
h_loss     = hamming_loss(all_labels, all_preds)

print("=" * 55)
print("           TEST SET RESULTS")
print("=" * 55)
print(f"  Micro F1     : {micro_f1:.4f}  (overall correctness)")
print(f"  Macro F1     : {macro_f1:.4f}  (fairness across rare emotions)")
print(f"  Hamming Loss : {h_loss:.4f}  (lower is better, 0 = perfect)")
print("=" * 55)
print("\nPer-emotion breakdown:")
print(classification_report(
    all_labels, all_preds,
    target_names=label_names,
    zero_division=0
))

# =============================================================================
# 5. PREDICT SINGLE SENTENCE
# =============================================================================
tokenizer = AutoTokenizer.from_pretrained("microsoft/deberta-v3-base", use_safetensors=True)

def predict(text: str, threshold: float = THRESHOLD):
    """Takes a single string of text, converts it to IDs, and outputs detected emotions."""
    
    # Step 1: Tokenize input
    enc = tokenizer(
        text, max_length=128,
        padding="max_length",
        truncation=True,
        return_tensors="pt"
    )
    
    # Step 2: Forward Pass
    with torch.no_grad():
        logits = model(
            enc["input_ids"].to(DEVICE),
            enc["attention_mask"].to(DEVICE)
        )
        
    # Step 3: Probabilities and Thresholding
    probs    = torch.sigmoid(logits).squeeze().cpu().numpy()
    detected = [
        (label_names[i], float(probs[i]))
        for i in range(NUM_LABELS)
        if probs[i] > threshold
    ]

    # Display results
    print(f"\n📝 Sentence: \"{text}\"")
    if detected:
        print("   Detected emotions:")
        for emotion, confidence in sorted(detected, key=lambda x: -x[1]):
            bar = "█" * int(confidence * 20)
            print(f"   {emotion:<20} {confidence:.1%}  {bar}")
    else:
        print("   No strong emotion detected (likely neutral)")

# =============================================================================
# 6. EMOTIONAL TIMELINE ANALYSIS
# =============================================================================
def analyze_timeline(text: str):
    """
    Advanced Feature: Visualizes the 'Emotional Journey' of a paragraph.
    This splits a long text into Beginning, Middle, and End stages, and uses
    the AI to classify the primary emotion in each section.
    """
    import re
    # Split the paragraph into sentences using punctuation
    sentences = re.split(r'(?<=[.!?]) +', text.strip())
    
    if len(sentences) <= 1:
        return predict(text)

    print(f"\n📈 Emotional Timeline Analysis:")
    print(f"   \" {text[:60]}... \"")
    
    # Group sentences into three sections: Start, Middle, End
    n = len(sentences)
    sections = {
        "START  ": sentences[:max(1, n//3)],
        "MIDDLE ": sentences[max(1, n//3) : min(n-1, 2*n//3)],
        "END    ": sentences[min(n-1, 2*n//3):]
    }
    
    # Process each section separately through the AI model
    for label, sents in sections.items():
        if not sents: continue
        section_text = " ".join(sents)
        
        enc = tokenizer(section_text, max_length=128, padding="max_length", truncation=True, return_tensors="pt")
        with torch.no_grad():
            logits = model(enc["input_ids"].to(DEVICE), enc["attention_mask"].to(DEVICE))
        probs = torch.sigmoid(logits).squeeze().cpu().numpy()
        
        detected = [(label_names[j], probs[j]) for j in range(NUM_LABELS) if probs[j] > THRESHOLD]
        
        # Show only the top primary emotion for that part of the story
        if detected:
            top_emo = sorted(detected, key=lambda x: -x[1])[0]
            bar = "█" * int(top_emo[1] * 15)
            print(f"   [{label}] Primary: {top_emo[0]:<12} ({top_emo[1]:.1%}) {bar}")
        else:
            print(f"   [{label}] Primary: neutral")


# ── Test predictions ───────────────────────────────────────────────────────────
print("\n" + "=" * 55)
print("           COMPREHENSIVE TESTING (50 SENTENCES)")
print("=" * 55)

test_sentences = [
    # Positive & High Energy
    "I can't wait to see what the future holds for us!",
    "This is the best surprise I've ever had in my life.",
    "We finally won the championship after all these years!",
    "I'm so proud of how far you've come with your art.",
    "Everything is finally falling into place perfectly.",
    # Social & Warm
    "You are such an inspiration to everyone around you.",
    "I really appreciate you sticking by me during the move.",
    "I honestly don't know what I would do without your support.",
    "You have such a kind heart and a beautiful soul.",
    "I'm sending you so much love and strength right now.",
    # Negative & Sharp
    "I am absolutely disgusted by how they treated those people.",
    "Stop making excuses and just take responsibility for once.",
    "It's so frustrating when people don't listen to basic logic.",
    "I can't believe you would say something so incredibly rude.",
    "Ugh, this food tastes like it's been sitting out for a week.",
    # Sad & Heavy
    "I feel so guilty for not being there when you needed me.",
    "It hurts so much to think that I'll never see them again.",
    "I'm really disappointed that the project got cancelled.",
    "Some days it's just really hard to find a reason to smile.",
    "I wish I could go back and change everything I said.",
    # Fear & Stress
    "I have a terrible feeling that something is about to go wrong.",
    "My heart is racing just thinking about the presentation tomorrow.",
    "I'm so confused, I thought we were meeting at the park?",
    "The sound of those footsteps in the hallway is terrifying.",
    "I don't understand why the instructions are so complicated.",
    # Intellectual & Curious
    "Wait, so the secret ingredient was just salt this whole time?",
    "I wonder if there is life on other planets in our galaxy.",
    "That makes total sense now that you've explained the math.",
    "I agree completely with your assessment of the situation.",
    "What would happen if we tried mixing these two colors?",
    # Subtle & Complex
    "Phew, I thought I lost my wallet, but it was just in the car.",
    "I'm actually quite impressed with how well this turned out.",
    "I wanted the ground to swallow me whole when I tripped on stage.",
    "Wow, I never expected to see you here of all places!",
    "I'm finally starting to feel comfortable in my own skin.",
    # Short & Punchy
    "Oh my god, yes!",
    "This is exhausting.",
    "Whatever, I don't care.",
    "You're kidding, right?",
    "I'm so sorry.",
    "Get out of here!",
    "I'm terrified.",
    "That's brilliant!",
    "I'm so lost.",
    "You're the best.",
    # Neutral / Ambiguous
    "The package is scheduled to arrive on Tuesday afternoon.",
    "I am currently sitting on the bus heading downtown.",
    "The weather report says it might rain later this evening.",
    "I finished reading the book you lent me yesterday.",
    "He walked across the street and entered the grocery store."
]


print("\n" + "=" * 55)
print("           PARAGRAPH TESTING (STORY MODE)")
print("=" * 55)

story_paragraphs = [
    # Story 1: Sadness -> Relief
    """I was walking home late at night and realized my phone was missing. I started panicking, 
    retracing every step I took, feeling absolutely hopeless and ready to cry. But then, 
    I checked the side pocket of my bag, and there it was! I've never felt so lucky in my life.""",

    # Story 2: Anger -> Annoyance
    """I can't believe how unprofessional that meeting was. I've been working on this project 
    for three months, and they just dismissed all my data without even looking at it. 
    It's just so typical of this company to ignore the hard work of their employees. 
    I'm honestly just tired of dealing with this constant lack of respect.""",

    # Story 3: Excitement -> Pride
    """The moment they called my name on stage, I felt like I was floating. 
    All those late nights in the library and the weekends I spent studying finally paid off. 
    Looking at my parents in the crowd, seeing them smile, made me realize that 
    I actually achieved something meaningful. I did it!""",

    # Story 4: Confusion -> Curiosity
    """I opened the box and found an object I had never seen before. It was made of 
    a strange, cold metal and had tiny symbols engraved all over the surface. 
    I'm not even sure what it's supposed to do or where it came from. 
    I spent the next hour trying to figure out if there was a way to turn it on.""",

    # Story 5: Fear -> Gratitude
    """I was terrified when I saw the smoke coming from the engine. I pulled over to the side 
    of the road, heart pounding, not knowing what to do in the middle of nowhere. 
    But then a kind stranger stopped and helped me fix the issue. 
    I am so incredibly grateful that they stopped to help a stranger like me.""",

    # Story 6: Disgust -> Amusement
    """I looked at the 'art piece' in the gallery and honestly felt a bit repulsed. 
    It was just a pile of literal trash glued together with old chewing gum. 
    But then I read the description and realized it was actually a prank by a local comedian. 
    I couldn't help but laugh at the absolute absurdity of the whole situation.""",

    # Story 7: Neutral -> Surprise
    """I was just sitting on the bench, watching the pigeons and waiting for the bus as usual. 
    It was a completely ordinary Tuesday afternoon with nothing special happening. 
    Suddenly, a full brass band marched around the corner playing my favorite song! 
    I was completely stunned and couldn't believe my eyes."""

]

for i, para in enumerate(story_paragraphs):
    print(f"\n--- STORY #{i+1} COMPARISON ---")
    print("Standard Prediction (Whole Paragraph):")
    predict(para)
    analyze_timeline(para)