# Emotion Detection in Text

Multi-label emotion detection across **28 emotion classes** using **DeBERTa-v3-base**, trained on the GoEmotions dataset. Built as a semester project for the Artificial Intelligence course at **FAST University, Semester 6**.

---

## What This Does

Given any piece of text, the model predicts which emotions are present and multiple emotions can be active at the same time.

```
Input:  "I can't believe she actually did it, I'm so proud"
Output: admiration (92%)  |  joy (81%)  |  surprise (74%)
```

The model handles all 28 GoEmotions classes: admiration, amusement, anger, annoyance, approval, caring, confusion, curiosity, desire, disappointment, disapproval, disgust, embarrassment, excitement, fear, gratitude, grief, joy, love, nervousness, optimism, pride, realization, relief, remorse, sadness, surprise, neutral.

---

## Results

Evaluated on the GoEmotions test set (6,329 samples):

| Metric | Score |
|---|---|
| Micro F1 | 0.56 |
| Macro F1 | 0.49 |
| Weighted F1 | 0.58 |
| Samples F1 | 0.59 |

**Best performing emotions:**

| Emotion | F1 |
|---|---|
| Gratitude | 0.89 |
| Amusement | 0.83 |
| Love | 0.74 |
| Admiration | 0.70 |

**Hardest emotions** (low training data / ambiguous language):

| Emotion | F1 | Test samples |
|---|---|---|
| Nervousness | 0.17 | 23 |
| Grief | 0.25 | 6 |
| Realization | 0.24 | 145 |

Full report : [`results/classification_report.txt`](results/classification_report.txt)

---

## Model Architecture

```
Input text
  → DeBERTa-v3-base Tokenizer  (max_length = 128)
  → DeBERTa-v3-base Backbone   (184M parameters)
  → [CLS] token                (768-dim vector)
  → Dropout (p = 0.3)
  → Linear layer               (768 → 28)
  → Sigmoid + threshold 0.3
  → Predicted emotions
```

---

## Training Details

| Setting | Value |
|---|---|
| Backbone | microsoft/deberta-v3-base |
| Dataset | GoEmotions (HuggingFace) |
| Batch size | 8 (grad accumulation × 4 = effective 32) |
| Learning rate | 1e-5 |
| Epochs | 4 |
| Precision | FP16 (GradScaler) |
| Optimizer | AdamW (weight_decay=0.01) |
| Loss | BCEWithLogitsLoss + class weights |
| Local GPU time | ~30 min/epoch |
| Colab T4 time | ~10 min/epoch |

##  Quick Start

**1. Clone the repo**
```bash
git clone https://github.com/SilverUmer21/emotion-detection-in-text.git
cd emotion-detection-in-text
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Prepare data**
```bash
python prepare_data.py
```

**4. Train the model**
```bash
python train.py
```
Weights will be saved to `emotion_model_deberta.pt` automatically (best validation loss checkpoint).

**5. Run inference**
```bash
python chat_with_model.py
```

> **Note:** The `.pt` weights file is not included in this repo due to size. You need to train the model first, or contact SilverUmer21 for the checkpoint.

---

## Project Structure

```
emotion-detection-in-text/
│
├── prepare_data.py          # Tokenization, multi-hot encoding, Dataset class
├── train.py                 # Training loop, weighted loss, checkpoint saving
├── chat_with_model.py       # Inference — takes text input, returns emotions
├── requirements.txt         # Python dependencies
│
└── results/
    └── classification_report.txt   # Full per-class evaluation on test set
```

---

## Team

Built by students of FAST University, Lahore — AI Course, Semester 6.

- Muhammad Umer
- Muhammad Ahmed Bajwa
- Muhammad Shayan Qadir
