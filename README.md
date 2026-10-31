# VeriScan – Universal AI Content Detection System

VeriScan is a unified AI-content detection system designed to identify AI-generated and human-written content across multiple modalities, including text, source code, and images.

The system integrates deep learning and transformer-based models through a FastAPI backend and a React frontend, providing a single platform for AI-generated content detection.

---

## 🚀 Key Features

- **Text Detection:** Identifies AI-generated and human-written text using a fine-tuned XLM-RoBERTa model.
- **Code Detection:** Analyzes source code to distinguish AI-generated code from human-written code using a fine-tuned DeepSeek-based model.
- **Image Detection:** Detects AI-generated images using a Vision Transformer (ViT)-based model.
- **Unified Platform:** Integrates text, code, and image detection into one application.
- **REST API:** Uses FastAPI to provide backend services and model inference.
- **Interactive UI:** React-based frontend for submitting content and viewing detection results.
- **External Model Hosting:** Stores large model weights on Google Drive instead of committing them to GitHub.

---

## 🏗️ System Architecture

```text
                    USER
                      |
                      v
               React Frontend
                      |
                      v
                FastAPI Backend
                      |
              +-------+-------+
              |       |       |
              v       v       v
            Text    Code    Image
          Detector Detector Detector
              |       |       |
              v       v       v
          XLM-R     DeepSeek   ViT
          oBERT     Based
              |       |       |
              +-------+-------+
                      |
                      v
              Detection Results
                      |
                      v
                 React UI
```

### Model Storage Architecture

Large model files are hosted externally on Google Drive.

- GitHub stores the application source code.
- Google Drive stores large trained model weights.
- The backend can download the required model files when they are not available locally.
- Downloaded models are loaded for inference.

---

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, JavaScript, CSS |
| Backend | Python, FastAPI |
| Text Detection | XLM-RoBERTa |
| Code Detection | DeepSeek-based Model |
| Image Detection | Vision Transformer (ViT) |
| Deep Learning | PyTorch, Transformers |
| Model Hosting | Google Drive |
| Version Control | Git, GitHub |

---

## 📊 Model Performance

The following results were obtained during experimental model evaluation.

| Detection Module | Model | Reported Accuracy |
|---|---|---:|
| Text Detection | Fine-tuned XLM-RoBERTa | 99.86% |
| Code Detection | Fine-tuned DeepSeek-based Model | ~60% |
| Image Detection | Vision Transformer (ViT) | ~57% |

**Note:** These results are based on specific evaluation datasets and experimental configurations. Performance may vary depending on the dataset, domain, and content characteristics.

---

## 📁 Project Structure

```text
VeriScan/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── ...
│
├── .gitignore
└── README.md
```

*Note: The directory structure above is illustrative. Adjust it to match the actual repository.*

---

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/V-VINAYKUMAR/VeriScan.git

cd VeriScan
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate the environment:

**macOS / Linux**

```bash
source .venv/bin/activate
```

**Windows**

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Download Model Weights

The trained model weights are hosted on Google Drive because of their large file sizes.

**Model Repository:**

[Download VeriScan Model Weights – Google Drive](https://drive.google.com/drive/u/1/folders/1_vPPKbSfNHPKyTwZ1jQBe3absNv5hfpe)

Download the required model files and place them in the appropriate model directories expected by the backend.

For automatic downloading through Python, you can use `gdown`:

```bash
pip install gdown
```

Example:

```python
import gdown
import os

MODEL_PATH = "models/text_model/model.safetensors"

if not os.path.exists(MODEL_PATH):
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    gdown.download(
        "YOUR_GOOGLE_DRIVE_FILE_URL",
        MODEL_PATH,
        quiet=False
    )
```

**Important:** Replace the placeholder URL with the actual Google Drive file link. Ensure the required model files and configurations are downloaded before running inference.

### 4. Start the Backend

```bash
uvicorn main:app --reload --port 8000
```

Backend URL:

```text
http://127.0.0.1:8000
```

API Documentation:

```text
http://127.0.0.1:8000/docs
```

### 5. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed in the terminal to access VeriScan.

---

## 📈 Model Evaluation

### 1. Text Detection

- Fine-tuned XLM-RoBERTa transformer model.
- Trained to classify human-written and AI-generated text.
- Evaluated on unseen test data.
- Achieved 99.86% accuracy on a balanced HC3 evaluation sample.

### 2. Code Detection

- DeepSeek-based model fine-tuned for AI-generated code detection.
- Evaluates source code to distinguish AI-generated and human-written implementations.
- Reported accuracy: approximately 60%.

### 3. Image Detection

- Vision Transformer (ViT)-based image classification.
- Designed to distinguish AI-generated images from real-world images.
- Reported accuracy: approximately 57%.

---

## 🔮 Future Improvements

- Improve generalization across different AI models and content domains.
- Increase code and image detection accuracy.
- Expand multilingual text detection capabilities.
- Optimize model inference and memory consumption.
- Scaling for the multi inputs at a time.
-Introduce the new feature for plagarism detection for PPTs,DOCx,pdf files.
- Introduce confidence calibration and explainable detection results.
- Deploy the application using cloud infrastructure.


## 📥 Model Weights

Due to the large size of trained model files, the model weights are hosted externally on Google Drive and are not included in this GitHub repository.

**Download:** [VeriScan – Model Weights (Google Drive)](https://drive.google.com/drive/u/1/folders/1_vPPKbSfNHPKyTwZ1jQBe3absNv5hfpe)

### Download Instructions

1. Open the Google Drive folder using the link above.
2. Download the required `model.safetensors` file.
3. Place the downloaded file in the appropriate backend model directory.
4. Ensure all required configuration and tokenizer files are available.
5. Start the backend application.

**Note:** Make sure the Google Drive folder has appropriate sharing permissions so users can access and download the model files.

---

## 📜 Disclaimer

VeriScan is an experimental AI-content detection system developed for academic and research purposes. Its predictions should not be treated as definitive proof of authorship or plagiarism. Detection performance depends on the underlying models, datasets, and evaluation conditions.

---

**Built with Python, Deep Learning, Transformers, FastAPI, and React.**

---

## 👨‍💻 Developer

**Vinay Kumar Vankayalapati**

B.Tech – Computer Science and Engineering  
Indian Institute of Information Technology Kottayam (IIIT Kottayam)

- GitHub: [V-VINAYKUMAR](https://github.com/V-VINAYKUMAR)


---
