"""
slide_segmenter.py — AI Slide Segmentation
============================================
Takes a patient-friendly medical summary and asks Gemini to break it into
3-5 content slides plus one final summary slide.
For each regular slide: produces medical keywords (word + English image_prompt).
For the final slide: consolidates all medications, diagnoses, referrals, tests,
and sick-leave entries into structured summary_items.
Returns a typed JSON array that server.py enriches with TTS audio and keyword
images before sending to the frontend.
"""
import json
import os
import time
from google import genai
from dotenv import load_dotenv

load_dotenv()

_LANG_NAMES = {
    "he": "Hebrew (עברית)",
    "en": "English",
    "ru": "Russian (Русский)",
    "ar": "Arabic (العربية)",
    "am": "Amharic (አማርኛ)",
}

_PROMPT = """\
You are given a patient-friendly medical visit summary.
Segment it into 3-5 presentation slides, plus ONE final summary slide.

Return ONLY a valid JSON array — no markdown fences, no extra text.

Each slide object has exactly these fields:
- "title"      : 2-4 word slide title in {lang_name}
- "icon"       : exactly one of: clipboard-list | stethoscope | pill | calendar-check | bed | heart-pulse | activity | info
- "content"    : 1-3 sentences in {lang_name} — this text will be read aloud to the patient, keep it warm and clear. NEVER include the patient's first name or last name anywhere in this text.
- "keywords"   : array of 2-4 keyword objects for THIS slide (NOT used on the final summary slide — set to [])
                 Each keyword object: {{ "word": "<medical term in {lang_name}>", "image_prompt": "<English description for image generation, 5-10 words, very specific medical visual>" }}
- "is_summary" : boolean — true ONLY for the very last slide
- "summary_items": array used ONLY on the last slide (set to [] on all other slides).
                   Each item: {{ "label": "<name>", "value": "<detail>", "type": "<type>" }}
                   type must be one of: medication | diagnosis | referral | test | sick_leave | other
                   Include every medication with dosage, every diagnosis, every referral, every lab test ordered, sick leave dates.

Icon selection guide:
  clipboard-list  → introduction, reason for visit
  stethoscope     → diagnosis, findings
  pill            → medications, treatment
  calendar-check  → follow-up tests, referrals, next steps
  bed             → sick leave
  heart-pulse     → chronic condition, cardiac
  activity        → general health, lab results
  info            → important notes

Keyword image_prompt examples (always in English, very visual):
  "painful swollen knee joint, medical illustration"
  "blood test tube with CBC label, laboratory"
  "white round antibiotic tablet, close-up"
  "blood pressure cuff on arm, clinic"
  "X-ray of chest lungs, radiology"

IMPORTANT: Do NOT use the patient's name anywhere in any slide content.

The LAST slide must:
  - have "is_summary": true
  - have "keywords": []
  - have "summary_items" listing ALL medications/diagnoses/referrals/tests/sick leave found in the entire summary
  - have "icon": "clipboard-list"
  - have "title" meaning "Visit Summary" in {lang_name}
  - have "content" as a short warm closing sentence in {lang_name}

All other slides must have "is_summary": false and "summary_items": [].

Medical summary to segment:
---
{text}
---"""


def segment(
    summary_text: str,
    language_code: str,
    model_name: str = "gemini-2.5-flash-lite",
) -> list[dict]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY not set")

    lang_name = _LANG_NAMES.get(language_code, "English")
    prompt = _PROMPT.format(lang_name=lang_name, text=summary_text.strip())

    client = genai.Client(api_key=api_key)
    last_err = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(model=model_name, contents=[prompt])
            break
        except Exception as e:
            last_err = e
            if "503" in str(e) and attempt < 2:
                time.sleep(3 ** attempt)  # exponential backoff: 1s, 3s, 9s
                continue
            raise
    else:
        raise last_err
    raw = response.text.strip()

    # Even with explicit instructions, the model sometimes wraps the JSON in ```json ... ```.
    # Split on ``` and try to parse each block — the valid JSON block will succeed.
    if "```" in raw:
        for block in raw.split("```"):
            cleaned = block.strip().lstrip("json").strip()
            try:
                return json.loads(cleaned)
            except (json.JSONDecodeError, ValueError):
                continue

    return json.loads(raw)
