import re
from datetime import datetime
from pathlib import Path
from rich.console import Console

console = Console(legacy_windows=False)

# Canonical ### headers — single source of truth for filtering
_ALL_SECTION_HEADERS = [
    "### Hebrew (עברית)",
    "### English",
    "### Russian (Русский)",
    "### Arabic (العربية)",
    "### Amharic (አማርኛ)",
]

# Keywords that identify each language section (case-insensitive)
_LANGUAGE_KEYWORDS = [
    (["hebrew", "עברית"],          "### Hebrew (עברית)"),
    (["english"],                   "### English"),
    (["russian", "русский"],        "### Russian (Русский)"),
    (["arabic", "العربية"],         "### Arabic (العربية)"),
    (["amharic", "አማርኛ"],          "### Amharic (አማርኛ)"),
]

# A line is treated as a section header if it looks like a header marker
_HEADER_PATTERN = re.compile(r"^(#{1,4}\s|\-\s*\*\*|\*\*|[A-Z][\w\s]+:)")


def _normalize(text: str) -> str:
    """Convert any section header format to canonical ### headers using keyword matching."""
    lines = text.splitlines(keepends=True)
    result = []
    for line in lines:
        stripped = line.rstrip()
        mapped = None
        if _HEADER_PATTERN.match(stripped):
            lower = stripped.lower()
            for keywords, canonical in _LANGUAGE_KEYWORDS:
                if any(kw in lower for kw in keywords):
                    mapped = canonical
                    break
        result.append((mapped + "\n") if mapped else line)
    return "".join(result)


def _filter_sections(text: str, languages: list[dict]) -> str:
    """Keep only the requested language sections. Hide headers when only one language."""
    wanted = {lang["section"] for lang in languages}
    single = len(wanted) == 1
    lines = text.splitlines(keepends=True)
    result = []
    skip = False

    for line in lines:
        stripped = line.rstrip()
        if stripped in _ALL_SECTION_HEADERS:
            skip = stripped not in wanted
            if not skip and not single:
                result.append(line)
        elif stripped == "---":
            skip = False
        elif not skip:
            result.append(line)

    return "".join(result).rstrip() + "\n"


def _validate(text: str, languages: list[dict]) -> list[str]:
    return [lang["section"] for lang in languages if lang["section"] not in text]


def process_response(response_text: str, languages: list[dict]) -> str:
    """Normalize and filter AI response to keep only the requested language sections."""
    normalized = _normalize(response_text)
    return _filter_sections(normalized, languages)


def save_and_print(
    response_text: str,
    source_pdf: str,
    languages: list[dict],
    output_dir: str = "outputs",
    no_file: bool = False,
) -> str | None:
    normalized = _normalize(response_text)
    filtered = _filter_sections(normalized, languages)

    missing = _validate(filtered, languages)
    if missing:
        console.print(f"[yellow]Warning: missing sections in response: {missing}[/yellow]")

    out_file = None
    if not no_file:
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        stem = Path(source_pdf).stem
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_file = out_path / f"{stem}_summary_{timestamp}.md"
        out_file.write_text(filtered, encoding="utf-8")
        console.print(f"[green]Saved:[/green] {out_file}")

    console.print("[green]Done.[/green] Open the file above to read the summary.")

    return str(out_file) if out_file else None
