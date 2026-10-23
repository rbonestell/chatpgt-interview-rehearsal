#!/usr/bin/env python3
"""Render plain, structured interview notes as a local branded PDF. No network I/O."""

import argparse
from html import escape
from io import BytesIO
import json
import os
from pathlib import Path
import sys
import unicodedata
from urllib.parse import urlsplit


def text(value, label):
    if not isinstance(value, str) or not value.strip() or len(value) > 4000:
        raise ValueError(f"{label} must be nonblank text of at most 4000 characters")
    if any(unicodedata.category(c) == "Cc" and c not in "\n\t" for c in value):
        raise ValueError(f"{label} contains unsupported control characters")
    return value.strip()


def text_list(value, label):
    if not isinstance(value, list) or len(value) > 30:
        raise ValueError(f"{label} must be a list of at most 30 text items")
    return [text(item, label) for item in value]


def validate(data):
    if not isinstance(data, dict):
        raise ValueError("Input must be a JSON object")
    allowed = {"role", "company", "stage", "evidence_note", "sections", "sources"}
    if data.keys() - allowed:
        raise ValueError("Input contains unsupported fields; see references/prep-brief.md")
    result = {key: text(data[key], key) for key in ["role", "company", "stage"] if key in data}
    if any(len(value) > 200 for value in result.values()):
        raise ValueError("role, company, and stage must each be at most 200 characters")
    result["evidence_note"] = text(data.get("evidence_note"), "evidence_note")
    sections = data.get("sections")
    if not isinstance(sections, list) or not 1 <= len(sections) <= 12:
        raise ValueError("sections must contain 1-12 study sections")
    result["sections"] = []
    for section in sections:
        if not isinstance(section, dict) or section.keys() - {"heading", "paragraphs", "bullets"}:
            raise ValueError("Each section accepts heading, paragraphs, and bullets only")
        item = {"heading": text(section.get("heading"), "section heading")}
        if len(item["heading"]) > 200:
            raise ValueError("Section headings must be at most 200 characters")
        for key in ["paragraphs", "bullets"]:
            item[key] = text_list(section.get(key, []), key)
        if not item["paragraphs"] and not item["bullets"]:
            raise ValueError("Each section needs a paragraph or bullet")
        result["sections"].append(item)
    sources = data.get("sources", [])
    if not isinstance(sources, list) or len(sources) > 20:
        raise ValueError("sources must be a list of at most 20 source objects")
    result["sources"] = []
    for source in sources:
        if not isinstance(source, dict) or set(source) != {"title", "url"}:
            raise ValueError("Each source requires title and url only")
        title = text(source["title"], "source title")
        url = text(source["url"], "source URL")
        parsed = urlsplit(url)
        if (parsed.scheme != "https" or not parsed.hostname or parsed.username
                or parsed.password or any(c.isspace() for c in url)):
            raise ValueError("Source URLs must use HTTPS without credentials or whitespace")
        result["sources"].append({"title": title, "url": url})
    return result


def render(data, font_path=None, bold_font_path=None):
    try:
        import reportlab
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_LEFT
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except ImportError as error:
        raise ValueError(
            "PDF dependency unavailable. Install scripts/requirements.txt in a Python virtual "
            "environment (see README), or use the readable-text brief."
        ) from error

    fonts = Path(reportlab.__file__).parent / "fonts"
    normal = TTFont("Brief", str(font_path or fonts / "Vera.ttf"))
    bold = TTFont("BriefBold", str(bold_font_path or fonts / "VeraBd.ttf"))
    pdfmetrics.registerFont(normal)
    pdfmetrics.registerFont(bold)
    # Avoid silently rendering unsupported names or non-Latin text as empty boxes.
    strings = [data["evidence_note"], *[data[k] for k in ["role", "company", "stage"] if k in data]]
    for section in data["sections"]:
        strings.extend([section["heading"], *section["paragraphs"], *section["bullets"]])
    for source in data["sources"]:
        strings.extend([source["title"], source["url"]])
    for value in strings:
        for char in value:
            if not char.isspace() and (ord(char) not in normal.face.charToGlyph
                                      or ord(char) not in bold.face.charToGlyph):
                raise ValueError(
                    f"Bundled fonts cannot render U+{ord(char):04X}. Use --font and --bold-font "
                    "with compatible TrueType fonts covering the brief's language, or provide text."
                )

    blue = colors.HexColor("#1749CB")
    ink = colors.HexColor("#202B40")
    muted = colors.HexColor("#536078")
    body = ParagraphStyle("Body", fontName="Brief", fontSize=10.5, leading=15.5,
                          textColor=ink, spaceAfter=7, alignment=TA_LEFT)
    heading = ParagraphStyle("Heading", parent=body, fontName="BriefBold", fontSize=13,
                             leading=18, textColor=blue, spaceBefore=13, spaceAfter=7,
                             keepWithNext=True)
    title = ParagraphStyle("Title", parent=heading, fontSize=23, leading=29, spaceBefore=0)
    small = ParagraphStyle("Small", parent=body, fontSize=9, leading=13, textColor=muted)
    bullet = ParagraphStyle("Bullet", parent=body, leftIndent=12, firstLineIndent=-10)

    def paragraph(value, style=body):
        # All notes are plain text, never ReportLab markup, local image paths, or code.
        return Paragraph(escape(value).replace("\n", "<br/>"), style)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=48, rightMargin=48,
                            topMargin=40, bottomMargin=48, title="Interview Prep Brief",
                            author="Interview Rehearsal", subject="Interview practice study guide",
                            pageCompression=1)
    title_content = [paragraph("Interview Prep Brief", title)]
    target = " | ".join(data[k] for k in ["role", "company"] if k in data)
    if target:
        title_content.append(paragraph(target))
    if "stage" in data:
        title_content.append(paragraph(data["stage"], small))
    icon = Path(__file__).resolve().parents[3] / "images" / "icon.png"
    if icon.is_file():
        header = Table([[title_content, Image(str(icon), width=44, height=44)]],
                       colWidths=[doc.width - 60, 60])
        header.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"), ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ]))
        story = [header]
    else:
        print("PDF note: packaged icon unavailable; using a text header.", file=sys.stderr)
        story = title_content
    story.extend([Spacer(1, 10), paragraph(data["evidence_note"], small)])
    for section in data["sections"]:
        story.append(paragraph(section["heading"], heading))
        story.extend(paragraph(value) for value in section["paragraphs"])
        story.extend(paragraph("- " + value, bullet) for value in section["bullets"])
    if data["sources"]:
        story.append(paragraph("Sources to revisit", heading))
        for source in data["sources"]:
            url = escape(source["url"], quote=True)
            story.append(Paragraph(
                f'<link href="{url}" color="#1749CB">{escape(source["title"])}</link>'
                f'<br/>{escape(source["url"])}', small))
    story.extend([Spacer(1, 12), paragraph(
        "Practice guidance based on the available evidence. This is not an employer assessment "
        "or a prediction of hiring outcomes.", small)])

    def footer(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#D9E1F2"))
        canvas.line(48, 34, letter[0] - 48, 34)
        canvas.setFillColor(muted)
        canvas.setFont("Brief", 8)
        canvas.drawString(48, 22, "Interview Rehearsal | Study notes")
        canvas.drawRightString(letter[0] - 48, 22, str(document.page))
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return buffer.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", default="-", help="UTF-8 JSON path, or - for stdin (default)")
    parser.add_argument("--output", required=True, type=Path, help="New PDF path; never overwrites")
    parser.add_argument("--font", type=Path, help="Optional local regular TrueType font")
    parser.add_argument("--bold-font", type=Path, help="Optional local bold TrueType font")
    args = parser.parse_args()
    try:
        if args.output.suffix.lower() != ".pdf":
            raise ValueError("Output path must end in .pdf")
        if args.output.exists() or args.output.is_symlink():
            raise ValueError("Output already exists; choose a new PDF filename")
        if bool(args.font) != bool(args.bold_font):
            raise ValueError("Provide both --font and --bold-font")
        if args.input == "-":
            raw = sys.stdin.buffer.read(1_048_577)
        else:
            with open(args.input, "rb") as source:
                raw = source.read(1_048_577)
        if len(raw) > 1_048_576:
            raise ValueError("Input exceeds the 1 MiB limit")
        data = validate(json.loads(raw.decode("utf-8")))
        pdf = render(data, args.font, args.bold_font)
        # Exclusive creation prevents overwriting even if a file appears during rendering.
        # The complete document is rendered in memory before opening the destination.
        with os.fdopen(os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "wb") as destination:
            destination.write(pdf)
        print(f"Created PDF: {args.output.resolve()}")
        return 0
    except Exception as error:
        # Avoid echoing candidate notes or a traceback into routine host output.
        message = str(error) if isinstance(error, (ValueError, OSError)) else "PDF rendering failed; check the input and runtime"
        print(f"PDF generation failed: {message}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
