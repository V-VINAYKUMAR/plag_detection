# Plag Detection

## About
Plag Detection is a machine learning project that classifies text as human-written or AI-generated using a fine-tuned XLM-RoBERTa model.

## Model
- XLM-RoBERTa-base
- Fine-tuned on the HC3 dataset

## Dataset
HC3 (Human ChatGPT Comparison Corpus)

https://huggingface.co/datasets/Hello-SimpleAI/HC3

## Technologies Used
- Python
- PyTorch
- Hugging Face Transformers
- Scikit-learn
- Pandas

## Features
- Detects AI-generated and human-written text
- Provides prediction probabilities
- Evaluates model performance using classification metrics

## Usage
Load the fine-tuned model and provide a text paragraph to obtain a prediction.

## Note
This project is designed for AI-generated text detection, not direct plagiarism detection. Predictions may not always be accurate, especially on text from sources different from the training dataset.
