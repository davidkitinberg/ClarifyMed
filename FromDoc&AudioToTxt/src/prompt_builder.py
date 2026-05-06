"""
prompt_builder.py — Gemini Prompt Construction
================================================
Assembles the full prompt sent to Gemini for medical summary generation.
Reads CLAUDE.md from the project root as the System Role (AI instructions).
Appends HMO-specific hints (HMO_HINTS) so Gemini knows how to parse tables
and fields that differ between each Israeli health-fund document format.
Returns a list of text parts that gemini_client combines with the uploaded
document / audio file.

⚠️  CLAUDE.md is part of the processing pipeline — do NOT delete it!
"""
from pathlib import Path

# parent.parent: from src/ up to FromDoc&AudioToTxt/ where CLAUDE.md lives
_CLAUDE_MD_PATH = Path(__file__).parent.parent / "CLAUDE.md"

HMO_HINTS = {
    "Clalit": (
        "This document is from Clalit (כללית). "
        "Diagnosis codes (ICD) appear in a table. Sick leave certificates are a separate section at the bottom."
    ),
    "Leumit": (
        "This document is from Leumit (לאומית). "
        "There is often a doctor's free-text note below the structured fields — extract information from both."
    ),
    "Maccabi": (
        "This document is from Maccabi (מכבי). "
        "It uses tabbed sections: 'תלונה עיקרית' for chief complaint, 'אבחנות' for diagnoses, 'טיפול תרופתי' for medications."
    ),
    "Meuhedet": (
        "This document is from Meuhedet (מאוחדת). "
        "It includes a referral section and a sick leave certificate in a bordered box near the bottom."
    ),
    "Unknown": (
        "This is an Israeli HMO medical document in Hebrew. "
        "Extract all structured information from tables and forms."
    ),
}

_BASE_INSTRUCTION = """
IMPORTANT OUTPUT RULES — follow exactly, no exceptions:
- Output raw Markdown only. No JSON, no code blocks, no extra commentary.
- USER LANGUAGE OVERRIDE: Generate ONLY the language sections listed below.
  Do NOT add any other languages, even if a previous instruction says to use all 5.
  The user has chosen specific languages for this request — respect that choice exactly.
- Each section must be a single flowing paragraph (no bullet points, no bold labels).

Please process the attached medical document and write a short, warm summary
for the PATIENT — not a clinical record. The tone should feel like a helpful
friend explaining what happened at the visit.

Start each paragraph with a short warm greeting appropriate to that language
(e.g. "שלום, קיבלנו את תוצאות הביקור שלך..." in Hebrew,
"Hello, here is a summary of your visit..." in English,
"Здравствуйте, вот краткое изложение вашего визита..." in Russian, etc.)
IMPORTANT: The greeting must NEVER include the patient's first name or last name — use only a generic greeting like "שלום" / "Hello" / "Здравствуйте".

Then focus ONLY on what matters to the patient:
1. What was found or diagnosed (in plain words, no medical jargon or codes)
2. What they need to do — medications with exact dosage and schedule
3. Sick leave — only if mentioned, include exact dates and number of days

Do NOT include: patient name, doctor name, visit date, clinic name,
medical record numbers, ICD codes, or any administrative details.
The patient's name must NEVER appear anywhere in the output.

Your entire response must be exactly this Markdown:

## סיכום ביקור רפואי

{language_sections}

Additional rules:
- Omit anything not in the document — do not say "not specified".
- Do NOT invent or assume any medical information.
- Translate all medical terms into simple everyday language.
- If sick leave is mentioned, include the exact dates and number of days naturally.
"""


def build(
    hmo: str,
    languages: list[dict],
    audio_transcript: str | None = None,
) -> list[str]:
    claude_md = _CLAUDE_MD_PATH.read_text(encoding="utf-8")

    sections = "\n\n".join(
        f"{lang['section']}\n[One natural paragraph in {lang['name']}]"
        for lang in languages
    )
    instruction = _BASE_INSTRUCTION.format(language_sections=sections)

    # Order matters: system role first, then document context, then optional transcript, then instruction.
    # Gemini weighs earlier parts more heavily when resolving conflicts.
    parts = [
        f"SYSTEM ROLE:\n{claude_md}\n",
        f"DOCUMENT CONTEXT:\n{HMO_HINTS.get(hmo, HMO_HINTS['Unknown'])}\n",
    ]

    if audio_transcript:
        parts.append(f"AUDIO TRANSCRIPT:\n{audio_transcript}\n")

    parts.append(instruction)
    return parts
