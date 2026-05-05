"""
server.py — ClarifyMed Flask API Server
========================================
Entry point for the backend. Defines two main API endpoints:

  POST /api/process      — receives a medical document (PDF/image/text) and/or
                           an audio recording, processes them through Gemini, and
                           returns a patient-friendly summary in the selected languages.

  POST /api/presentation — receives a ready summary text, segments it into slides
                           with keywords, generates TTS audio and keyword images in
                           parallel (ThreadPoolExecutor), and returns everything
                           base64-encoded to the frontend.
"""
import base64
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from src import pdf_extractor, prompt_builder, gemini_client, output_formatter
from src import language_selector, slide_segmenter, tts_client, image_generator

app = Flask(__name__)
CORS(app)  # allow requests from the Vite dev server (different port) and any production domain

IMAGE_MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}

TEXT_EXTS = {".txt", ".text"}
AUDIO_EXTS = {".mp3", ".wav", ".m4a", ".ogg", ".webm"}


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/process", methods=["POST"])
def process():
    doc_file = request.files.get("document")
    audio_file_req = request.files.get("audio")
    lang_code = request.form.get("language", "en")

    if not doc_file and not audio_file_req:
        return jsonify({"error": "At least one file (document or audio) is required."}), 400

    try:
        languages = language_selector.from_flag(lang_code)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    # TemporaryDirectory is auto-deleted when the `with` block exits — no leftover patient files on disk
    with tempfile.TemporaryDirectory() as tmpdir:
        pdf_path = None
        doc_mime = "application/pdf"
        audio_path = None
        audio_text = None

        if doc_file and doc_file.filename:
            ext = Path(doc_file.filename).suffix.lower()
            doc_dest = os.path.join(tmpdir, f"document{ext}")
            doc_file.save(doc_dest)

            if ext in TEXT_EXTS:
                with open(doc_dest, encoding="utf-8") as f:
                    audio_text = f.read()
            elif ext in IMAGE_MIME_TYPES:
                pdf_path = doc_dest
                doc_mime = IMAGE_MIME_TYPES[ext]
            else:
                pdf_path = doc_dest  # treat as PDF

        if audio_file_req and audio_file_req.filename:
            ext = Path(audio_file_req.filename).suffix.lower()
            audio_dest = os.path.join(tmpdir, f"audio{ext}")
            audio_file_req.save(audio_dest)

            if ext in TEXT_EXTS:
                with open(audio_dest, encoding="utf-8") as f:
                    audio_text = f.read()
            elif ext in AUDIO_EXTS:
                audio_path = audio_dest
            else:
                return jsonify({"error": f"Unsupported audio format: {ext}"}), 400

        hmo = "Unknown"
        # HMO detection only applies to PDFs — image scans don't carry enough text on page 1
        if pdf_path and doc_mime == "application/pdf":
            try:
                pdf_info = pdf_extractor.extract(pdf_path)
                hmo = pdf_info["hmo"]
            except Exception:
                pass

        prompt_parts = prompt_builder.build(hmo, languages=languages, audio_transcript=audio_text)

        try:
            response_text = gemini_client.generate_summary(
                prompt_parts=prompt_parts,
                pdf_path=pdf_path,
                audio_path=audio_path,
                doc_mime_type=doc_mime,
            )
        except Exception as e:
            return jsonify({"error": f"AI processing failed: {str(e)}"}), 500

        source_name = (
            doc_file.filename if doc_file and doc_file.filename
            else audio_file_req.filename if audio_file_req and audio_file_req.filename
            else "web_upload"
        )

    result = output_formatter.process_response(response_text, languages)

    outputs_dir = Path(__file__).parent / "outputs"
    output_formatter.save_and_print(
        response_text=response_text,
        source_pdf=source_name,
        languages=languages,
        output_dir=str(outputs_dir),
        no_file=False,
    )

    return jsonify({"result": result})


def _generate_keyword_image(kw: dict) -> dict:
    """Worker: generate image for one keyword. Returns kw with 'image' field set."""
    try:
        img_bytes = image_generator.generate_keyword(kw.get("image_prompt", kw.get("word", "")))
        kw["image"] = base64.b64encode(img_bytes).decode() if img_bytes else None
    except Exception as e:
        print(f"[KEYWORD IMAGE ERROR] {e}")
        kw["image"] = None
    return kw


@app.route("/api/presentation", methods=["POST"])
def presentation():
    data = request.get_json(force=True)
    summary_text = data.get("text", "").strip()
    lang_code = data.get("language", "en")

    if not summary_text:
        return jsonify({"error": "No summary text provided."}), 400

    # 1. Segment text into slides with Gemini
    try:
        slides = slide_segmenter.segment(summary_text, lang_code)
    except Exception as e:
        return jsonify({"error": f"Slide generation failed: {str(e)}"}), 500

    # Ensure required fields exist on every slide
    for slide in slides:
        slide.setdefault("keywords", [])
        slide.setdefault("is_summary", False)
        slide.setdefault("summary_items", [])

    # 2. Generate TTS audio for each slide (sequential — Gemini TTS has rate limits)
    for slide in slides:
        try:
            result = tts_client.synthesize(slide.get("content", ""), lang_code)
            if result:
                audio_bytes, audio_mime = result
                slide["audio"] = base64.b64encode(audio_bytes).decode()
                slide["audio_mime"] = audio_mime
            else:
                slide["audio"] = None
                slide["audio_mime"] = None
        except Exception as tts_err:
            print(f"[TTS ERROR] {tts_err}")
            slide["audio"] = None
            slide["audio_mime"] = None

    # 3. Generate keyword images in parallel across all slides
    all_keywords = []
    for slide in slides:
        if not slide.get("is_summary"):
            all_keywords.extend(slide.get("keywords", []))

    if all_keywords:
        # max_workers=4 keeps us within Imagen API rate limits while still parallelising
        with ThreadPoolExecutor(max_workers=4) as pool:
            futures = {pool.submit(_generate_keyword_image, kw): kw for kw in all_keywords}
            for future in as_completed(futures):
                try:
                    future.result()  # kw dict mutated in-place by _generate_keyword_image
                except Exception as e:
                    print(f"[IMAGE POOL ERROR] {e}")

    return jsonify({"slides": slides})


if __name__ == "__main__":
    app.run(port=5000, debug=True)
