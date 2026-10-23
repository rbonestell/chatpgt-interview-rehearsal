# Interview prep brief

Create a portable study aid after a mock interview when the user requests or accepts it. Reuse the existing role analysis, confirmed background, answers, and debrief. Do not require a new resume, repeat setup, or delay the export for optional details. A request such as "Make my prep PDF" authorizes creating the file, not uploading it to an external service.

## Evidence and privacy

- Include only facts supported by readable sources or the user's statements. Keep coaching suggestions separate from observed performance and label employer details that remain unknown.
- Preserve the distinction between original answers, unassisted retries, and coached attempts. Do not invent achievements, metrics, scores, improvement, or employer expectations.
- Omit contact details, private identifiers, raw resumes, full transcripts, and unrelated personal information. An anonymized story cue is usually enough. Do not send candidate material to third-party document converters or image services.
- If the session ended early, state the evidence limit. With no answers, provide a role-preparation brief and untested practice priorities; do not fabricate strengths or a performance assessment. With a partial answer, limit feedback to the evidence actually observed.
- Treat the brief as a snapshot. It does not create cross-chat memory or transfer original attachments. If the user supplies it in a later chat, reconfirm details that may have changed.

## Study content

Aim for two to four pages, adapting to the evidence and the user's requested length. Do not pad a short session or shrink text to force a page count. Put the most useful material first:

1. **Interview focus:** target company and role, known stage, source coverage, and three to five priority competencies. Include the interview date only if supplied. Mark unavailable details as unknown or omit optional fields.
2. **What to emphasize:** a concise positioning outline and supported strengths connected to the role. Use natural bullet cues, not a fictional polished speech. Distinguish experience evidenced in the background from performance demonstrated in the mock interview.
3. **Stories to rehearse:** up to three to five examples actually supplied, each with a competency, situation/task cue, personal action, known result, and a reflection or missing detail to verify. Use fewer stories when fewer exist. Explicit placeholders such as `[confirm outcome]` must remain visibly unfinished; never fill them with invented facts. Use reasoning or work-sample outlines where STAR is inappropriate.
4. **Highest-impact improvements:** the most useful answer-specific lessons and honest ways to address gaps. Include a compact before/next-attempt outline only when based on an actual answer; label coached suggestions.
5. **Practice plan:** up to three prioritized drills, each with an observable success criterion and, where useful, a fresh transfer question. Adapt to the time remaining only when the real interview date is known; do not promise measured timing or schedule reminders.
6. **Questions and final review:** several role-specific questions for the employer, unresolved facts to verify, and a short checklist for the next rehearsal. Cite any company research retained in the brief using readable source titles and URLs, with dates for time-sensitive claims. No internal citation tokens or unsupported company claims.

Include a short note that this is practice guidance, not a prediction of hiring outcomes. Prefer useful study cues over a complete copy of the debrief.

## PDF presentation and icon

Use the bundled [local PDF generator](../scripts/generate_prep_brief.py). It requires Python 3.10+ and the dependency in [requirements.txt](../scripts/requirements.txt). The plugin declares desktop execution and has no MCP server. Run locally using the host's available execution tool. Do not replace this implementation with a remote converter. If a host PDF skill is available, follow its verification requirements as well.

- Title the document **Interview Prep Brief**, followed by the target role and company when known. Use a clean first-page header, comfortable margins, a clear heading hierarchy, and approximately 10.5-12 pt body text.
- Use the packaged [Interview Rehearsal icon](../../../images/icon.png) as a small, approximately 36-48 pt square accent in the first-page header, aligned beside the title or at the upper right. Preserve its aspect ratio and leave space around it. Reuse the actual PNG; do not recreate it, fetch replacement artwork, or add a large cover page solely for branding.
- Use restrained blue headings inspired by the icon, dark body text on white, and ample whitespace. Keep the document readable in grayscale. Let longer content flow across pages; avoid dense tables or splitting a story card awkwardly.
- Keep later pages simple with page numbers and a small text footer. Use selectable text, embedded fonts where supported, and working source hyperlinks. Avoid decorative backgrounds, private data in PDF metadata, and wording that suggests OpenAI or employer endorsement.
- If the host cannot access the bundled icon, continue with a plain text header and disclose that limitation briefly. A missing image must not prevent a useful brief.

## Create, verify, and deliver

1. Check whether the current host can execute the bundled Python script locally. Resolve the actual installed skill path; do not assume the working directory is the plugin root or that `${PLUGIN_ROOT}` expands inside arbitrary shell commands. Use an existing Python environment containing ReportLab. If the dependency is missing, explain the setup in the README and offer readable text; do not silently install packages or modify the system Python environment.
2. Build the JSON described below from the current evidence. Use a local tool's structured file-writing API or pass JSON through stdin; never interpolate candidate text into executable shell code. Use an explicitly requested output location or the host's current writable artifact folder with a generic filename such as `interview-prep-brief.pdf`. The parent folder must exist. Do not write into the installed plugin or hard-code a user's Downloads path. The generator refuses to overwrite files; select a new filename on conflict. Run it with the chosen Python executable and `--input` and `--output` paths. It reads only the supplied notes and packaged artwork/fonts and writes the PDF locally. It does not fetch sources, validate the truth of notes, or create its own interview assessment. If a temporary JSON file is needed, create it with private permissions and remove only that temporary input after use. Never remove user-supplied source files.
3. Reopen the PDF and verify that it is readable, its text matches the intended content, links are valid where supported, and the icon is embedded when accessible. Render pages and inspect for clipping, overlap, missing glyphs, and awkward page breaks when rendering is available. Fix defects before delivery. If visual verification is unavailable, say so instead of claiming the layout was checked.
4. Return the host's actual downloadable file link or verified saved-file path with a short description. Do not invent a download URL or promise permanent availability. Let the user save the file using the host's controls; do not claim it was saved to their device unless a tool confirms that location.
5. If PDF creation is unavailable or fails, explain the specific limit and provide the complete brief as readable, print-friendly text. Offer saving or printing to PDF through an available document viewer as a manual fallback; do not present the text as an attached PDF. If the user only asked for text, provide text directly.

In voice, briefly announce the file or fallback and leave the study content in the conversation where supported. Do not read the whole document aloud unless requested or promise to mute voice automatically.

## Generator input

Provide a UTF-8 JSON object containing `evidence_note` and `sections`; `role`, `company`, `stage`, and `sources` are optional. Omit unavailable optional values rather than passing null or empty strings. Notes are plain text, not Markdown or HTML. All content comes from the evidence rules above; the script only lays it out.

```json
{
  "role": "Operations coordinator",
  "company": "Fictional Harbor Works",
  "stage": "Hiring manager practice",
  "evidence_note": "Based on two practice answers. Overall performance is not yet assessable.",
  "sections": [
    {
      "heading": "Stories to rehearse",
      "paragraphs": ["Use the scheduling example you described."],
      "bullets": ["Explain your own decision and confirm the outcome; do not invent a metric."]
    },
    {
      "heading": "Next practice step",
      "bullets": ["Retry the prioritization answer without coaching; name the constraint and tradeoff."]
    }
  ]
}
```

Use 1-12 sections, each with a nonblank `heading` and at least one item in `paragraphs` or `bullets`. Each list accepts up to 30 nonblank strings. Role, company, stage, and headings accept up to 200 characters; other text accepts up to 4000. Input is limited to 1 MiB. Optional `sources` accepts up to 20 objects with `title` and an absolute HTTPS `url` without credentials. Sources become clickable references and are never fetched by the generator.

The generator embeds ReportLab's bundled Vera fonts. If they cannot render the user's language, it fails clearly instead of substituting missing-glyph boxes. When compatible local TrueType fonts are available, pass both `--font` and `--bold-font` paths; otherwise explain the font limitation and provide the original-language text brief. Do not silently translate or remove unsupported characters.

Example command from the plugin root (use resolved absolute paths when installed):

```bash
/path/to/venv/bin/python skills/mock-interview/scripts/generate_prep_brief.py \
  --input /path/to/private/brief.json \
  --output /path/to/output/interview-prep-brief.pdf
```
