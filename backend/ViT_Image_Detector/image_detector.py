"""Inference-only wrapper for the fine-tuned ViT image detector."""
from pathlib import Path
from PIL import Image
import torch
from transformers import AutoImageProcessor, ViTForImageClassification

DEFAULT_MODEL_DIR = Path(__file__).resolve().parent


class ImageDetector:
    def __init__(self, model_dir=DEFAULT_MODEL_DIR, device=None):
        self.model_dir = Path(model_dir)
        if not self.model_dir.exists():
            raise FileNotFoundError(f"Image model directory not found: {self.model_dir}")

        self.device = torch.device(
            device or (
                "cuda" if torch.cuda.is_available()
                else "mps" if torch.backends.mps.is_available()
                else "cpu"
            )
        )
        self.processor = AutoImageProcessor.from_pretrained(
            str(self.model_dir), local_files_only=True
        )
        from transformers import ViTConfig

        config = ViTConfig.from_pretrained(
            str(self.model_dir), local_files_only=True
        )
        self.model = ViTForImageClassification(config)

        weights_path = self.model_dir / "image.safetensors"
        if not weights_path.is_file():
            raise FileNotFoundError(f"Image weights not found: {weights_path}")

        from safetensors.torch import load_file
        state_dict = load_file(str(weights_path), device="cpu")
        self.model.load_state_dict(state_dict, strict=True)
        self.model.to(self.device)
        self.model.eval()

        # Matches the image notebook's explicit config: 0 = AI-generated, 1 = Real.
        self.labels = {0: "AI-generated", 1: "Real"}

    @torch.inference_mode()
    def predict(self, image_input) -> dict:
        """image_input may be a filesystem path or a PIL.Image.Image."""
        if isinstance(image_input, (str, Path)):
            with Image.open(image_input) as image:
                image = image.convert("RGB")
        elif isinstance(image_input, Image.Image):
            image = image_input.convert("RGB")
        else:
            raise TypeError("image_input must be a file path or PIL Image")

        inputs = self.processor(images=image, return_tensors="pt")
        inputs = {key: value.to(self.device) for key, value in inputs.items()}
        probabilities = torch.softmax(self.model(**inputs).logits, dim=-1)[0]
        pred_id = int(probabilities.argmax().item())
        return {
            "detector": "image",
            "prediction": self.labels.get(pred_id, f"LABEL_{pred_id}"),
            "confidence": round(float(probabilities[pred_id]) * 100, 2),
            "ai_probability": round(float(probabilities[0]) * 100, 2),
            "real_probability": round(float(probabilities[1]) * 100, 2),
        }


_detector = None

def load_model(model_dir=DEFAULT_MODEL_DIR, device=None):
    return ImageDetector(model_dir=model_dir, device=device)

def detect_image(image_input) -> dict:
    global _detector
    if _detector is None:
        _detector = load_model()
    return _detector.predict(image_input)
