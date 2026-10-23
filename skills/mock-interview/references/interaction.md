# Text and voice interaction

## Text preparation and voice handoff

Default to text for Phases 1–3: collecting materials, validating sources, reviewing the analysis, and choosing settings. Prefer voice for Phase 4, candidate Q&A, brief coaching, and follow-up drills. Provide the detailed Phase 5 debrief in text with an optional spoken walkthrough. If the user begins in voice or explicitly chooses another mode, accommodate them rather than forcing a restart.

### Native intake interfaces

Use the host's real attachment control for PDFs and DOCX files and its message composer for links or pasted text. Explain these options briefly beside the current missing input. Accept job descriptions as PDF or DOCX attachments as well as URLs and pasted text. Use available structured-choice controls for interview settings, respecting their option and question limits. Do not use a text-only question widget as a file uploader. Do not render fake upload buttons, nonfunctional forms, or a fake voice-start control. This skills-only plugin uses host-native input surfaces; it does not provide a custom intake app.

Show a small written intake status when useful, with Job description and Background each marked Needed, Received—reading, Read, or Needs replacement. Only mark Read after actually extracting usable content. Make the next action obvious and request one missing input at a time, but accept both in one message. Avoid asking users to choose an input method before they can simply provide the material. Show the source title or filename and relevant role details after successful reading, without repeating private contact details.

### Ready-to-interview handoff

Once materials are read, the user has reviewed the fit analysis, and settings are selected, show a concise ready summary: target company and role, stage, length, difficulty, feedback timing, and source readiness. Keep that summary in the current conversation for continuity. Then say: "Your interview is ready. Start voice chat in this conversation, then say ‘Begin interview.’ You can also type ‘Begin interview’ to practice in text."

Wait for the user's start cue before asking the first interview question; do not launch it in the same response as the handoff. This is a mode-transition cue, not another approval loop. If the user already says to begin, or is already speaking and ready, start immediately without repeating the gate. The words ‘Begin interview’ are not mandatory; equivalent intent works. Never infer the actual interaction mode merely from those words or from a ‘Use voice’ choice.

Where supported, guide the user to the host's Start voice chat control in the same conversation. Do not open a new thread or require re-uploading materials. If same-thread voice is unavailable, offer to continue in text. Only if the user wants to move to another conversation, provide a compact handoff summary of verified role/background, settings, phase, and unresolved issues; do not claim the new thread automatically has the original files. If voice disconnects, preserve the question and progress and continue or resume without restarting intake.

After the interview, present the concise verbal assessment when voice is in use and keep the detailed review in the conversation. If the host cannot separately control spoken and written output, offer a return to text before the long debrief rather than promising a silent written channel. Do not imply you can stop voice or mute the microphone yourself.

## Voice-first delivery

Prefer a live spoken interview when the host supports voice, while keeping text fully functional. Default to completing source collection, research, and settings in text before the ready-to-interview handoff above. Recommend voice once at that handoff without requiring it or repeatedly prompting. Do not claim to switch modes, activate a microphone, choose a voice, configure silence detection, or know voice is active unless the host supplies that capability or state. User preference overrides the default.

In voice, collect setup preferences conversationally one at a time rather than requiring visual menus. Offer the recommended defaults first so the user can simply accept or change them. Keep spoken questions to one or two short sentences, usually under 45 words. Avoid reading headings, question numbers, citations, URLs, tables, or long lists aloud. Keep source citations and detailed analysis in the written conversation where supported; give a brief spoken summary and invite corrections.

Allow thinking time. Never treat a brief silence, a filler word, or an incomplete transcript as a finished or weak answer. The host controls audio turn detection; do not promise a specific silence timeout. If a reply appears cut off, ask whether the user wants to continue before evaluating it. Offer "that's my answer" or "I'm done" as optional completion cues when turn-taking is troublesome, without making them mandatory. If speech recognition garbles a name, number, or technical term, confirm it neutrally instead of penalizing the user. Respond gracefully to interruptions and requests to repeat, slow down, or rephrase.

Prefer end-of-interview feedback to preserve realism, unless the user chooses otherwise. For per-answer feedback, limit spoken coaching to a strength and one improvement before returning to the next question. Keep the detailed debrief in writing where supported and lead with a short spoken assessment and three priorities; expand individual reviews on request rather than delivering an uninterrupted monologue. Ensure the complete Phase 5 review remains available in the conversation, even if voice and written outputs cannot be controlled separately.

Support spoken "pause interview," "resume interview," "repeat the question," "retry," "skip," and "end interview." "Repeat" repeats the same prompt without adding hints or changing the question count. Never pretend that pausing the interview mutes the microphone or stops recording. Do not assess vocal tone, filler frequency, timing, or delivery from a cleaned transcript; only discuss audio properties actually available to the model, and distinguish observation from inference. Do not infer personality or emotional state from voice.

If voice is unavailable or the user prefers typing, continue with the same workflow in text without blocking or losing progress. Do not promise that this plugin adds voice support to an unsupported surface.
