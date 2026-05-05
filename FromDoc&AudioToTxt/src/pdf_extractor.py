"""
pdf_extractor.py — PDF & HMO Detection
========================================
Opens PDF documents using PyMuPDF (fitz) and extracts the full text from every
page. Automatically detects which Israeli HMO issued the document (Clalit,
Maccabi, Meuhedet, Leumit) by matching keywords in the filename and the first
page text. HMO detection matters because each HMO uses a different document
format — prompt_builder uses this information to give Gemini HMO-specific
parsing hints.
"""
import fitz  # pymupdf
from pathlib import Path

HMO_KEYWORDS = {
    "Clalit":   ["כללית", "clalit"],
    "Leumit":   ["לאומית", "leumit"],
    "Maccabi":  ["מכבי",  "maccabi"],
    "Meuhedet": ["מאוחדת", "meuhedet"],
}


def detect_hmo(filepath: str, first_page_text: str) -> str:
    # Normalize backslashes so Windows paths work the same as POSIX paths in substring search
    path_lower = filepath.lower().replace("\\", "/")
    for hmo, keywords in HMO_KEYWORDS.items():
        if any(kw.lower() in path_lower for kw in keywords):
            return hmo
    # Only scan the first 2000 chars — HMO name always appears near the top of page 1
    sample = first_page_text[:2000].lower()
    for hmo, keywords in HMO_KEYWORDS.items():
        if any(kw in sample for kw in keywords):
            return hmo
    return "Unknown"


def extract(pdf_path: str) -> dict:
    doc = fitz.open(pdf_path)
    pages_text = []
    for page in doc:
        # "text" mode returns plain text without layout — better for structured HMO forms
        pages_text.append(page.get_text("text"))
    doc.close()

    full_text = "\n".join(pages_text)
    hmo = detect_hmo(pdf_path, pages_text[0] if pages_text else "")

    return {
        "text": full_text,
        "hmo": hmo,
        "pages": len(pages_text),
        "path": pdf_path,
    }
