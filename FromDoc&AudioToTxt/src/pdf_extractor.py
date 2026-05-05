import fitz  # pymupdf
from pathlib import Path

HMO_KEYWORDS = {
    "Clalit":   ["כללית", "clalit"],
    "Leumit":   ["לאומית", "leumit"],
    "Maccabi":  ["מכבי",  "maccabi"],
    "Meuhedet": ["מאוחדת", "meuhedet"],
}


def detect_hmo(filepath: str, first_page_text: str) -> str:
    path_lower = filepath.lower().replace("\\", "/")
    for hmo, keywords in HMO_KEYWORDS.items():
        if any(kw.lower() in path_lower for kw in keywords):
            return hmo
    sample = first_page_text[:2000].lower()
    for hmo, keywords in HMO_KEYWORDS.items():
        if any(kw in sample for kw in keywords):
            return hmo
    return "Unknown"


def extract(pdf_path: str) -> dict:
    doc = fitz.open(pdf_path)
    pages_text = []
    for page in doc:
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
