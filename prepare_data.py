# file: prepare_data.py
import torch
from torch.utils.data import Dataset
from transformers import AutoTokenizer
from datasets import load_dataset

# Load the dataset to get features and labels
dataset = load_dataset("go_emotions", "simplified")
label_names = dataset["train"].features["labels"].feature.names
NUM_LABELS = len(label_names)  # 28

# Load the tokenizer that matches our model
# 'bert-base-uncased' is standard for emotion detection
print("Loading BERT tokenizer...")
tokenizer = AutoTokenizer.from_pretrained("microsoft/deberta-v3-base", use_safetensors=True)

# takes a raw sentence and turns it into numbers that deberta can understand
# basically tokenizes the text, pads it to 128 tokens so everything is the same length,
# and truncates anything longer than that. returns pytorch tensors ready to feed into the model
def text_to_input(text):
    """
    Converts a raw sentence into BERT's numerical format.
    - max_length=128 covers almost all GoEmotions sentences.
    - padding="max_length" ensures all vectors are the same size.
    - truncation=True handles outliers.
    """
    return tokenizer(
        text,
        max_length=128,
        padding="max_length",
        truncation=True,
        return_tensors="pt"
    )

# converts a list of label indices (like [1, 5]) into a one-hot style vector of length 28
# so if the sentence has emotions 'admiration' and 'joy', it puts 1.0 at those positions
# and 0.0 everywhere else. we need this format because bce loss expects float vectors not indices
def labels_to_vector(label_list):
    """
    Converts a list of label indices like [1, 5] into a 28-dimensional vector:
    [0, 1, 0, 0, 0, 1, 0, ..., 0]
    This multi-hot format is required for BCEWithLogitsLoss.
    """
    vector = torch.zeros(NUM_LABELS, dtype=torch.float32)
    for label_idx in label_list:
        vector[label_idx] = 1.0
    return vector

# custom dataset class that wraps the huggingface dataset so pytorch's dataloader can use it
# it handles tokenizing each sentence and converting labels on the fly when you grab a sample
# this way we don't have to preprocess the entire dataset into memory at once
class EmotionDataset(Dataset):
    """
    A custom PyTorch Dataset that wraps the HuggingFace dataset.
    This allows us to use PyTorch's DataLoader efficiently.
    """
    # just stores the huggingface split (train/val/test) so we can access it later
    def __init__(self, hf_split):
        self.data = hf_split

    # returns how many samples are in this split, pytorch needs this to know when an epoch ends
    def __len__(self):
        return len(self.data)

    # grabs one sample by index, tokenizes the text and converts labels to a vector
    # squeeze(0) is needed because the tokenizer adds an extra batch dimension we don't want here
    def __getitem__(self, idx):
        row = self.data[idx]
        encoding = text_to_input(row["text"])
        labels = labels_to_vector(row["labels"])
        
        # Squeeze removes the batch dimension added by return_tensors="pt"
        return {
            "input_ids":      encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "labels":         labels
        }

# Create splits for the rest of the project
train_dataset = EmotionDataset(dataset["train"])
val_dataset   = EmotionDataset(dataset["validation"])
test_dataset  = EmotionDataset(dataset["test"])

if __name__ == "__main__":
    print(f"Dataset split counts:")
    print(f"  Train:      {len(train_dataset)}")
    print(f"  Validation: {len(val_dataset)}")
    print(f"  Test:       {len(test_dataset)}")

    # Quick sanity check — take the first row and verify shapes
    print("\n--- Sanity Check ---")
    sample = train_dataset[0]
    print(f"Original Text: '{dataset['train'][0]['text']}'")
    print(f"Input IDs shape:      {sample['input_ids'].shape}")      # Should be [128]
    print(f"Attention Mask shape: {sample['attention_mask'].shape}") # Should be [128]
    print(f"Labels vector shape:  {sample['labels'].shape}")         # Should be [28]
    print(f"Labels vector: \n{sample['labels']}")
