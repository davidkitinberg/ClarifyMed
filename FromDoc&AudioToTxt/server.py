import os
import tempfile
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from src import pdf_extractor, prompt_builder, gemini_client, output_formatter
from src import language_selector

app = Flask(__name__)
CORS(app)

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

        # Determine a meaningful source name for the output filename
        source_name = (
            doc_file.filename if doc_file and doc_file.filename
            else audio_file_req.filename if audio_file_req and audio_file_req.filename
            else "web_upload"
        )

    result = output_formatter.process_response(response_text, languages)

    # Save to outputs/ folder (same as CLI usage)
    outputs_dir = Path(__file__).parent / "outputs"
    output_formatter.save_and_print(
        response_text=response_text,
        source_pdf=source_name,
        languages=languages,
        output_dir=str(outputs_dir),
        no_file=False,
    )

    return jsonify({"result": result})


if __name__ == "__main__":
    app.run(port=5000, debug=True)
