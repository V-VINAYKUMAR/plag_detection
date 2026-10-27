
from pathlib import Path

import torch
from safetensors.torch import load_file
from transformers import AutoTokenizer, XLMRobertaForSequenceClassification

MODEL_DIR = Path(__file__).resolve().parent


class TextDetector:
    def __init__(self, model_dir=MODEL_DIR, device=None):
        self.model_dir = Path(model_dir)
        self.device = torch.device(
            device or ("mps" if torch.backends.mps.is_available()
                       else "cpu")
        )

        # Load tokenizer from the existing local files
        self.tokenizer = AutoTokenizer.from_pretrained(
            str(self.model_dir),
            local_files_only=True
        )

        # Build the architecture from config.json
        from transformers import AutoConfig

        config = AutoConfig.from_pretrained(
            str(self.model_dir),
            local_files_only=True
        )
        self.model = XLMRobertaForSequenceClassification(config)

        # Load the actual trained weights
        weights_path = self.model_dir / "text.safetensors"
        if not weights_path.exists():
            raise FileNotFoundError(f"Missing weights: {weights_path}")

        state_dict = load_file(str(weights_path), device="cpu")
        self.model.load_state_dict(state_dict, strict=True)

        self.model.to(self.device)
        self.model.eval()

        self.labels = {
            0: "Human-written",
            1: "AI-generated"
        }

    @torch.inference_mode()
    def predict(self, text: str) -> dict:
        if not isinstance(text, str) or not text.strip():
            raise ValueError("Please provide non-empty text.")

        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        logits = self.model(**inputs).logits
        probabilities = torch.softmax(logits, dim=-1)[0]

        pred_id = int(probabilities.argmax().item())

        return {
            "detector": "text",
            "prediction": self.labels[pred_id],
            "human_probability": round(probabilities[0].item() * 100, 2),
            "ai_probability": round(probabilities[1].item() * 100, 2),
            "confidence": round(probabilities[pred_id].item() * 100, 2)
        }


def load_model():
    return TextDetector()


if __name__ == "__main__":
    detector = load_model()
    result = detector.predict(
        "Artificial intelligence can help automate repetitive tasks."
    )
    print(result)
