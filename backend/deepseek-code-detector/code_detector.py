"""Inference-only wrapper for the DeepSeek-Coder LoRA authorship detector.

The notebook trains a causal LM with a LoRA adapter and scores candidate labels
by next-token log-probability. By default this loads the adapter directory plus
its original base model. For a merged model, pass merged_model_dir and use the
merged loader path below.
"""
from pathlib import Path
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForCausalLM

BASE_MODEL = "deepseek-ai/deepseek-coder-1.3b-base"
DEFAULT_ADAPTER_DIR = Path(__file__).resolve().parent
DEFAULT_MERGED_DIR = Path(__file__).resolve().parent / "merged_model"

PROMPT_TEMPLATE = (
    "Classify the authorship of the following code as AI or HUMAN.\n"
    "Output only one label: AI or HUMAN.\n\n"
    "Code:\n"
)
AI_THRESHOLD = 0.60
HUMAN_THRESHOLD = 0.40


class CodeDetector:
    def __init__(self, adapter_dir=DEFAULT_ADAPTER_DIR, merged_model_dir=None,
                 base_model=BASE_MODEL, device=None):
        self.adapter_dir = Path(adapter_dir)
        self.merged_model_dir = Path(merged_model_dir) if merged_model_dir else None
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))

        if self.merged_model_dir and (self.merged_model_dir / "config.json").exists():
            model_path = str(self.merged_model_dir)
            self.tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path, torch_dtype=torch.float16 if self.device.type == "cuda" else torch.float32,
                local_files_only=True
            )
        else:
            if not self.adapter_dir.exists():
                raise FileNotFoundError(
                    f"Code adapter directory not found: {self.adapter_dir}. "
                    "Place the saved final_adapter folder here, or configure adapter_dir."
                )
            # Adapter tokenizer may be saved with adapter; otherwise use base model tokenizer.
            try:
                self.tokenizer = AutoTokenizer.from_pretrained(
                    str(self.adapter_dir), local_files_only=True
                )
            except (OSError, ValueError):
                self.tokenizer = AutoTokenizer.from_pretrained(
                    str(self.adapter_dir / "local_base"),
                    local_files_only=True
                )

            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token

            dtype = torch.float16 if self.device.type == "cuda" else torch.float32
            base_path = self.adapter_dir / "local_base"
            base = AutoModelForCausalLM.from_pretrained(
                str(base_path),
                local_files_only=True,
                use_safetensors=True,
                dtype="auto",
                low_cpu_mem_usage=True
            )
            try:
                from peft import PeftModel
            except ImportError as exc:
                raise ImportError("Install peft to load the code LoRA adapter: pip install peft") from exc
            self.model = PeftModel.from_pretrained(base, str(self.adapter_dir), is_trainable=False)

        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        self.model.to(self.device)
        self.model.eval()

    @torch.inference_mode()
    def _candidate_score(self, prompt_ids, attention_mask, label):
        label_ids = self.tokenizer(" " + label, add_special_tokens=False)["input_ids"]
        context = prompt_ids
        mask = attention_mask
        total_score = 0.0
        for token_id in label_ids:
            outputs = self.model(input_ids=context, attention_mask=mask)
            next_logits = outputs.logits[0, -1, :]
            log_probs = F.log_softmax(next_logits.float(), dim=-1)
            total_score += float(log_probs[token_id].item())

            next_token = torch.tensor([[token_id]], device=context.device)
            context = torch.cat([context, next_token], dim=1)
            mask = torch.cat([mask, torch.ones((1, 1), dtype=mask.dtype, device=mask.device)], dim=1)
        return total_score

    def predict(self, code: str) -> dict:
        if not isinstance(code, str) or not code.strip():
            raise ValueError("code must be a non-empty string")

        prompt = PROMPT_TEMPLATE + code + "\n\nLabel:"
        inputs = self.tokenizer(
            prompt, return_tensors="pt", truncation=True, max_length=504
        )
        inputs = {key: value.to(self.device) for key, value in inputs.items()}

        ai_score = self._candidate_score(inputs["input_ids"], inputs["attention_mask"], "AI")
        human_score = self._candidate_score(inputs["input_ids"], inputs["attention_mask"], "HUMAN")
        relative = torch.softmax(torch.tensor([ai_score, human_score]), dim=0)
        ai_conf = float(relative[0].item())
        human_conf = float(relative[1].item())

        if ai_conf >= AI_THRESHOLD:
            prediction = "AI-generated"
        elif ai_conf <= HUMAN_THRESHOLD:
            prediction = "Human-written"
        else:
            prediction = "Uncertain"

        return {
            "detector": "code",
            "prediction": prediction,
            "ai_confidence": round(ai_conf * 100, 2),
            "human_confidence": round(human_conf * 100, 2),
        }


_detector = None

def load_model(adapter_dir=DEFAULT_ADAPTER_DIR, merged_model_dir=None, device=None):
    return CodeDetector(adapter_dir=adapter_dir, merged_model_dir=merged_model_dir, device=device)

def detect_code(code: str) -> dict:
    global _detector
    if _detector is None:
        _detector = load_model()
    return _detector.predict(code)
