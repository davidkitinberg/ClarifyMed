import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Try nano-banana first, fall back to imagen-4 fast
_MODELS = [
    "nano-banana-pro-preview",
    "imagen-4.0-fast-generate-001",
]

_BASE_STYLE = (
    "photorealistic, professional medical photography, "
    "clean composition, soft natural lighting, calming colors, "
    "no text, no people's faces"
)

_KEYWORD_STYLE = (
    "simple clean medical illustration, white background, "
    "icon style, no text, no people's faces, flat vector art"
)


def _call_imagen(client: genai.Client, prompt: str, aspect_ratio: str) -> bytes | None:
    for model in _MODELS:
        try:
            response = client.models.generate_images(
                model=model,
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio=aspect_ratio,
                    output_mime_type="image/jpeg",
                ),
            )
            return response.generated_images[0].image.image_bytes
        except Exception as e:
            print(f"[IMAGE] {model} failed: {e}")
            continue
    return None


def generate(slide_title: str, icon: str) -> bytes | None:
    """Generate a 4:3 hero image for a slide. Returns raw JPEG bytes or None."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    client = genai.Client(api_key=api_key)
    prompt = f"{slide_title}. {_BASE_STYLE}."
    return _call_imagen(client, prompt, "4:3")


def generate_keyword(image_prompt: str) -> bytes | None:
    """Generate a 1:1 square illustration for a keyword card. Returns raw JPEG bytes or None."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    client = genai.Client(api_key=api_key)
    prompt = f"{image_prompt}. {_KEYWORD_STYLE}."
    return _call_imagen(client, prompt, "1:1")
