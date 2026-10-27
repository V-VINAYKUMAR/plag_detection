from pathlib import Path
import sys

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
CODE_DIR = BASE_DIR / "deepseek-code-detector"

sys.path.insert(0, str(CODE_DIR))
from code_detector import detect_code

TEXT_DIR = BASE_DIR / 'AI_Text_Detector'
sys.path.insert(0, str(TEXT_DIR))
from text_detector import load_model as load_text_model

IMAGE_DIR = BASE_DIR / 'ViT_Image_Detector'
sys.path.insert(0, str(IMAGE_DIR))
from image_detector import detect_image

text_detector = None

def get_text_detector():
    global text_detector
    if text_detector is None:
        text_detector = load_text_model()
    return text_detector

app = FastAPI(title="Universal Plagiarism Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str

@app.get("/")
def root():
    return {"message": "Universal Plagiarism Detection API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/api/detect/code")
def detect_code_endpoint(request: CodeRequest):
    try:
        return detect_code(request.code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


class TextRequest(BaseModel):
    text: str


@app.post("/api/detect/text")
def detect_text_endpoint(request: TextRequest):
    try:
        return get_text_detector().predict(request.text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


from fastapi import File, UploadFile
from PIL import Image
import io


@app.post("/api/detect/image")
async def detect_image_endpoint(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        return detect_image(image)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Image detection failed: {exc}")
