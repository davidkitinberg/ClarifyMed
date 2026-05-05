import argparse
import sys
import time
from pathlib import Path
from rich.console import Console

from src import pdf_extractor, prompt_builder, gemini_client, output_formatter, audio_handler
from src import language_selector

console = Console(legacy_windows=False)


def process_one(
    args,
    languages: list[dict],
    pdf_path: str | None = None,
    audio_path_file: str | None = None,
    audio_text: str | None = None,
) -> None:
    label = pdf_path or audio_path_file
    console.print(f"\n[bold cyan]Processing:[/bold cyan] {label}")
    t0 = time.time()

    # PDF extraction + HMO detection (only when PDF is given)
    hmo = args.hmo or "Unknown"
    pages = None
    if pdf_path:
        pdf_info = pdf_extractor.extract(pdf_path)
        hmo = args.hmo or pdf_info["hmo"]
        pages = pdf_info["pages"]
        console.print(f"  HMO detected: [bold]{hmo}[/bold]  |  Pages: {pages}")

    if audio_path_file:
        console.print(f"  Audio: [bold]{Path(audio_path_file).name}[/bold]")
    elif audio_text:
        console.print("  Audio: loaded as text transcript")

    lang_names = ", ".join(l["label"] for l in languages)
    console.print(f"  Languages: [bold]{lang_names}[/bold]")

    prompt_parts = prompt_builder.build(hmo, languages=languages, audio_transcript=audio_text)

    console.print("  Calling Gemini API...")
    response = gemini_client.generate_summary(
        prompt_parts=prompt_parts,
        pdf_path=pdf_path,
        audio_path=audio_path_file,
        model_name=args.model,
    )

    # Use PDF name if available, otherwise audio name
    source_name = pdf_path or audio_path_file
    output_formatter.save_and_print(
        response_text=response,
        source_pdf=source_name,
        languages=languages,
        output_dir=args.output,
        no_file=args.no_file,
    )

    console.print(f"  Done in [bold]{time.time() - t0:.1f}s[/bold]")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Medical Document Processor — PDF, audio, or both"
    )

    # Input options — at least one required (enforced below)
    parser.add_argument("--pdf",    metavar="PATH", help="PDF file to process")
    parser.add_argument("--folder", metavar="PATH", help="Batch-process all PDFs in a folder")
    parser.add_argument("--audio",  metavar="PATH", help="Audio file (.mp3/.wav/.m4a/.ogg) or transcript (.txt)")

    parser.add_argument("--hmo",    choices=["Clalit", "Leumit", "Maccabi", "Meuhedet"],
                        help="Override HMO detection")
    parser.add_argument("--lang",   metavar="CODES",
                        help="Language codes: he, en, ru, ar, am — comma-separated, or 'all'")
    parser.add_argument("--output", default="outputs", metavar="DIR",
                        help="Output directory (default: outputs/)")
    parser.add_argument("--no-file", action="store_true",
                        help="Print to terminal only, do not save .md file")
    parser.add_argument("--model",  default="gemini-2.5-flash-lite", metavar="MODEL",
                        help="Gemini model name")

    args = parser.parse_args()

    # Validate: need at least one input source
    if not args.pdf and not args.folder and not args.audio:
        parser.error("Provide at least one input: --pdf, --folder, or --audio")

    if args.folder and args.audio:
        parser.error("--audio cannot be combined with --folder")

    if args.pdf and args.folder:
        parser.error("--pdf and --folder are mutually exclusive")

    # Language selection
    if args.lang:
        try:
            languages = language_selector.from_flag(args.lang)
        except ValueError as e:
            console.print(f"[red]Error:[/red] {e}")
            sys.exit(1)
    else:
        languages = language_selector.interactive()

    # ── AUDIO ONLY ──────────────────────────────────────────────────────────
    if args.audio and not args.pdf and not args.folder:
        audio_info = audio_handler.load(args.audio)
        if audio_info["type"] == "transcript":
            process_one(args, languages, audio_text=audio_info["text"])
        else:
            process_one(args, languages, audio_path_file=audio_info["path"])
        return

    # ── SINGLE PDF (+ optional audio) ───────────────────────────────────────
    if args.pdf:
        pdf_path = Path(args.pdf)
        if not pdf_path.exists():
            console.print(f"[red]Error:[/red] File not found: {args.pdf}")
            sys.exit(1)
        if pdf_path.suffix.lower() != ".pdf":
            console.print(f"[red]Error:[/red] Not a PDF file: {args.pdf}")
            sys.exit(1)

        audio_text = None
        audio_file_path = None
        if args.audio:
            audio_info = audio_handler.load(args.audio)
            if audio_info["type"] == "transcript":
                audio_text = audio_info["text"]
            else:
                audio_file_path = audio_info["path"]

        process_one(args, languages,
                    pdf_path=str(pdf_path),
                    audio_path_file=audio_file_path,
                    audio_text=audio_text)
        return

    # ── FOLDER BATCH ────────────────────────────────────────────────────────
    if args.folder:
        folder = Path(args.folder)
        if not folder.is_dir():
            console.print(f"[red]Error:[/red] Folder not found: {args.folder}")
            sys.exit(1)
        pdfs = sorted(folder.rglob("*.pdf"))
        if not pdfs:
            console.print(f"[yellow]No PDF files found in:[/yellow] {args.folder}")
            sys.exit(0)
        console.print(f"[bold]Found {len(pdfs)} PDF(s) in {args.folder}[/bold]")
        for pdf in pdfs:
            process_one(args, languages, pdf_path=str(pdf))
        console.print(f"\n[bold green]All done — processed {len(pdfs)} file(s).[/bold green]")


if __name__ == "__main__":
    main()
