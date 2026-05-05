"""
gemini_client.py — Gemini Text Generation Client
==================================================
Handles all communication with Gemini for producing the medical summary.
Uploads PDF / audio files to the Gemini Files API (too large to send inline),
waits for processing to complete, sends the prompt together with the uploaded
files, and immediately deletes the cloud copies after receiving the response
to protect patient privacy. Includes automatic retry logic (3 attempts) for
transient 503 errors.
"""
import io
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

SUPPORTED_AUDIO_MIME = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
    ".webm": "audio/webm",
}


def _client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY not found in environment / .env file")
    return genai.Client(api_key=api_key)


def _upload_file(client: genai.Client, path: str, mime_type: str):
    # Read as bytes and use an ASCII-safe display name to avoid Hebrew filename
    # encoding issues in HTTP headers.
    data = Path(path).read_bytes()
    safe_name = f"upload_{abs(hash(path))}"  # deterministic per path, avoids Hebrew chars in HTTP headers
    uploaded = client.files.upload(
        file=io.BytesIO(data),
        config=types.UploadFileConfig(display_name=safe_name, mime_type=mime_type),
    )
    # Gemini processes files asynchronously — poll until state leaves PROCESSING
    while uploaded.state.name == "PROCESSING":
        time.sleep(2)
        uploaded = client.files.get(name=uploaded.name)
    if uploaded.state.name == "FAILED":
        raise RuntimeError(f"Gemini file upload failed for: {path}")
    return uploaded


def generate_summary(
    prompt_parts: list[str],
    pdf_path: str | None = None,
    audio_path: str | None = None,
    doc_mime_type: str = "application/pdf",
    model_name: str = "gemini-2.5-flash-lite",
) -> str:
    if not pdf_path and not audio_path:
        raise ValueError("At least one of pdf_path or audio_path must be provided.")

    client = _client()
    content_parts: list = []
    uploaded_files = []

    if pdf_path:
        pdf_file = _upload_file(client, pdf_path, doc_mime_type)
        content_parts.append(types.Part.from_uri(file_uri=pdf_file.uri, mime_type=doc_mime_type))
        uploaded_files.append(pdf_file)

    if audio_path:
        ext = Path(audio_path).suffix.lower()
        mime = SUPPORTED_AUDIO_MIME.get(ext, "audio/mpeg")
        audio_file = _upload_file(client, audio_path, mime)
        content_parts.append(types.Part.from_uri(file_uri=audio_file.uri, mime_type=mime))
        uploaded_files.append(audio_file)

    # Files must come before the text prompt — Gemini reads content_parts in order
    content_parts.extend(prompt_parts)

    last_err = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=content_parts,
            )
            break
        except Exception as e:
            last_err = e
            if "503" in str(e) and attempt < 2:
                time.sleep(3 ** attempt)  # exponential backoff: 1s, 3s, 9s
                continue
            raise
    else:
        raise last_err

    # Delete cloud copies immediately — patient data must not persist on Gemini servers
    try:
        for f in uploaded_files:
            client.files.delete(name=f.name)
    except Exception:
        pass  # deletion failure is non-fatal; we still return the response

    return response.text
