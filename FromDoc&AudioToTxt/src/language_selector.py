from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console(legacy_windows=False)

# Ordered list — order is preserved in the output
LANGUAGES = [
    {"code": "he", "label": "Hebrew",   "name": "Hebrew (עברית)",    "section": "### Hebrew (עברית)"},
    {"code": "en", "label": "English",  "name": "English",            "section": "### English"},
    {"code": "ru", "label": "Russian",  "name": "Russian (Русский)",  "section": "### Russian (Русский)"},
    {"code": "ar", "label": "Arabic",   "name": "Arabic (العربية)",   "section": "### Arabic (العربية)"},
    {"code": "am", "label": "Amharic",  "name": "Amharic (አማርኛ)",    "section": "### Amharic (አማርኛ)"},
]

_CODE_MAP = {lang["code"]: lang for lang in LANGUAGES}


def from_flag(lang_str: str) -> list[dict]:
    """Parse --lang flag value (e.g. 'he,en' or 'all')."""
    if lang_str.strip().lower() == "all":
        return list(LANGUAGES)
    codes = [c.strip().lower() for c in lang_str.split(",")]
    result = []
    for code in codes:
        if code not in _CODE_MAP:
            valid = ", ".join(l["code"] for l in LANGUAGES)
            raise ValueError(f"Unknown language code '{code}'. Valid codes: {valid}, all")
        result.append(_CODE_MAP[code])
    return result


def interactive() -> list[dict]:
    """Show a numbered menu and return the selected languages."""
    table = Table(show_header=False, box=None, padding=(0, 2))
    table.add_column(style="bold cyan", width=4)
    table.add_column(style="bold", width=10)

    for i, lang in enumerate(LANGUAGES, 1):
        table.add_row(f"[{i}]", lang["label"])
    table.add_row(f"[{len(LANGUAGES) + 1}]", "All")

    console.print(Panel(table, title="[bold]Select summary language(s)[/bold]", border_style="cyan"))
    console.print("[dim]Enter numbers separated by commas (e.g. 1,3 for Hebrew + Russian)[/dim]")

    while True:
        try:
            raw = input("  → ").strip()
        except (EOFError, KeyboardInterrupt):
            console.print("\n[yellow]Cancelled.[/yellow]")
            raise SystemExit(0)

        if not raw:
            continue

        all_idx = len(LANGUAGES) + 1
        try:
            chosen = [int(x.strip()) for x in raw.split(",")]
        except ValueError:
            console.print("[red]Please enter numbers only.[/red]")
            continue

        if any(n < 1 or n > all_idx for n in chosen):
            console.print(f"[red]Numbers must be between 1 and {all_idx}.[/red]")
            continue

        if all_idx in chosen:
            return list(LANGUAGES)

        # preserve original order, deduplicate
        seen = set()
        result = []
        for n in chosen:
            lang = LANGUAGES[n - 1]
            if lang["code"] not in seen:
                seen.add(lang["code"])
                result.append(lang)
        return result
