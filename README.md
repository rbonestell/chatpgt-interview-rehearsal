# Interview Rehearsal plugin for ChatGPT

<p align="center">
  <img src="images/social.png" alt="Interview Rehearsal icon" width="480" height="240">
  <br />
  Free voice-first, role-specific mock interview practice plugin for ChatGPT.
</p>

**Best experienced in the ChatGPT desktop app.** Prepare in text, switch to voice in the same conversation for a natural interview rehearsal, then return to your written feedback and practice plan.

## Installing in ChatGPT

Add the GitHub marketplace **`rbonestell/chatpgt-interview-rehearsal`**, then install **Interview Rehearsal** from it.

1. Open **Plugins → Add → Add a marketplace** in ChatGPT desktop.
2. Enter `rbonestell/chatpgt-interview-rehearsal` as the source.
3. Leave the other fields empty to use the repository root and follow its default branch.
4. Select **Add marketplace** and authorize GitHub access if prompted.
5. Open **Plugins**, find **Interview Rehearsal** in the imported marketplace, and select **Install plugin**.
6. Select **Try now** to start.

## Using Interview Rehearsal

1. Start a new ChatGPT conversation.
2. Type `@` to select the installed plugin.
3. Tag `@Interview Rehearsal` and ask it to help you prepare: “`@Interview Rehearsal` Start a voice-first mock interview tailored to my background and a specific job opening.”
4. Provide your resume or LinkedIn profile and the job description or posting URL.

## What to try

1. Provide a job description URL (or paste the job description) and a resume PDF/DOCX (or pasted work history / accessible LinkedIn profile).
2. Confirm the role-fit analysis and select interview stage, length, difficulty, and feedback timing.
3. At the ready prompt, transition the app's voice control to start ChatGPT Voice **in the same conversation**, then say "Begin interview". You can also continue entirely in text.
4. Try "pause interview", "resume interview", "repeat the question", and "retry".
5. Finish and review the written feedback. Note whether questions were role-specific, whether follow-ups were realistic, and whether the feedback was supported by your actual answers.
6. Ask **"Create my interview prep brief as a PDF."** Save a study guide with your strongest story cues, specific improvements, practice drills, and questions for the real interviewer. The PDF uses the Interview Rehearsal icon in a simple header where the asset is accessible.

## Important notes

- No separate API key, external service account, or server setup is needed to use the plugin.
- Voice support and web/file access come from the ChatGPT host and might vary by plan or client.
- PDF prep briefs use the host's available file-creation tools. If PDF creation is unavailable, the plugin provides a readable brief you can copy into a document and save or print as a PDF.
- The plugin cannot automatically turn on voice mode or evaluate tone/body language from text transcripts.
- Your resume and job description are supplied to your own ChatGPT conversation. Avoid uploading anything confidential that you are not authorized to share.
- This plugin simulates interviews; it has no affiliation with any employer and does not predict hiring decisions.

## Privacy, terms, and support

See the [privacy policy](PRIVACY.md) for how this skills-only plugin uses ChatGPT's features and how support reports are handled. See the [terms of use](TERMS.md) for plugin usage terms. Report problems through [GitHub Issues](https://github.com/rbonestell/chatpgt-interview-rehearsal/issues); do not include private candidate information.

## License

See [LICENSE](LICENSE) for license terms.
