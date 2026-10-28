# Emotion Detection in Text

<p align="center"><img src="launch/media/subtext-vs.gif" width="360" alt="SUBTEXT, a pixel-art office PC, beats BERT-base on macro F1 in a fighting-game VS screen"></p>

Multi-label emotion detection across **28 emotion classes** using **DeBERTa-v3-base**, trained on the GoEmotions dataset. Built as a semester project for the Artificial Intelligence course at **FAST University, Semester 6**.

Its launch persona is **SUBTEXT**, a beige office PC that reads the emotion behind any message. It is good at gratitude, bad at nervousness, and sarcasm still fools it.

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

Evaluated on the GoEmotions test set (5,427 comments carrying 6,329 emotion labels):

| Metric | Score |
|---|---|
| Micro F1 | 0.56 |
| Macro F1 | 0.49 |
| Weighted F1 | 0.58 |
| Samples F1 | 0.59 |

For reference, the original GoEmotions paper (Demszky et al., 2020) reports an average (macro) F1 of 0.46 for fine-tuned BERT-base on the same 28 labels.

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

## Launch Video

`launch/` renders a 45-second pixel-art launch video (1080×1350) and its cover images entirely from code: a canvas scene drawn frame by frame in Playwright, and a soundtrack synthesised with numpy from the same event log, so every sound lands on its frame. The predictions shown on screen are read from `launch/scores.js`.

```bash
# 1. score the video's lines with the trained model (writes launch/scores.js)
python launch/predict_lines.py --weights emotion_model_deberta.pt

# 2. render frames, soundtrack and the final MP4
node launch/render.cjs frames launch/out
python launch/soundtrack.py launch/out/events.json launch/out/soundtrack.wav
ffmpeg -framerate 30 -i launch/out/f%04d.jpg -i launch/out/soundtrack.wav -c:v libx264 -pix_fmt yuv420p -crf 18 \
  -c:a aac -b:a 192k -af loudnorm=I=-14:TP=-1 -shortest launch/out/subtext-launch.mp4

# covers: video thumbnail, LinkedIn banner, GitHub social preview, LinkedIn Featured card
node launch/render.cjs covers launch/out
```

Open `launch/scene.html?play` through any local web server to watch the edit loop in a browser.

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
├── results/
│   └── classification_report.txt   # Full per-class evaluation on test set
│
└── launch/                  # SUBTEXT launch video and covers, rendered from code
    ├── predict_lines.py     # Scores the video's lines (lines.json) into scores.js
    ├── video.js             # The 45 s edit: render(t) plus the sound-cue log
    ├── pixel.js, pixel-scenes.js   # Pixel-art toolkit and scene pieces
    ├── covers.js            # Thumbnail, banner, social preview, Featured card
    ├── render.cjs           # Playwright renderer
    └── soundtrack.py        # Music and SFX synthesised from the event log
```

---

## Team

Built by students of FAST University, Lahore — AI Course, Semester 6.

- Muhammad Umer
- Muhammad Ahmed Bajwa
- Muhammad Shayan Qadir
