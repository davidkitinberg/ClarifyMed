import io
import os
import wave
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

_GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"
_GEMINI_VOICE = "Aoede"  # multilingual — works for Hebrew, Arabic, Russian, etc.


def _pcm_to_wav(pcm_data: bytes, sample_rate: int = 24000) -> bytes:
    """Wrap raw PCM bytes in a WAV container so the browser can play it."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)        # 16-bit
        w.setframerate(sample_rate)
        w.writeframes(pcm_data)
    return buf.getvalue()


def synthesize(text: str, language_code: str) -> tuple[bytes, str] | None:
    """
    Returns (audio_bytes, mime_type) or None if no key is available.
    Uses Gemini TTS — no extra API setup beyond GEMINI_API_KEY.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=_GEMINI_TTS_MODEL,
        contents=text,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=_GEMINI_VOICE
                    )
                )
            ),
        ),
    )

    part = response.candidates[0].content.parts[0]
    raw = part.inline_data.data
    mime = part.inline_data.mime_type  # e.g. "audio/pcm;rate=24000"

    if "pcm" in mime.lower():
        rate = 24000
        if "rate=" in mime:
            try:
                rate = int(mime.split("rate=")[1].split(";")[0])
            except (ValueError, IndexError):
                pass
        return _pcm_to_wav(raw, sample_rate=rate), "audio/wav"

    return raw, mime
