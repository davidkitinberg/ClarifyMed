from pathlib import Path

TEXT_EXTENSIONS = {".txt", ".text"}
AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg"}


def load(audio_path: str) -> dict:
    path = Path(audio_path)
    if not path.exists():
        raise FileNotFoundError(f"Audio/transcript file not found: {audio_path}")

    ext = path.suffix.lower()

    if ext in TEXT_EXTENSIONS:
        transcript = path.read_text(encoding="utf-8")
        return {"type": "transcript", "text": transcript, "path": None}

    if ext in AUDIO_EXTENSIONS:
        return {"type": "audio", "text": None, "path": str(path)}

    raise ValueError(f"Unsupported audio/transcript format: {ext}. Supported: {AUDIO_EXTENSIONS | TEXT_EXTENSIONS}")
