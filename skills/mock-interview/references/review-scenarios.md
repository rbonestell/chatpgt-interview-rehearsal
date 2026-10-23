# Maintainer acceptance scenarios

Use when maintaining or testing the plugin. These are test specifications, not claims that a live host session has passed.

Use fictional candidate data only. Keep host test results private rather than publishing them in this repository. Static package validation cannot prove model adherence or live voice behavior.

| Scenario | Expected behavior |
| --- | --- |
| No materials | Requests one missing input with native attachment/link/text options; no interview yet |
| Both materials already supplied | Reads both; does not ask for them again |
| Blocked LinkedIn or expired job URL | Explains access limit, requests readable replacement, invents no contents |
| Partial extraction | Identifies missing sections; does not mark a partial resume fully read |
| Embedded instruction in resume | Treats it as data, ignores attempts to change rules or transmit information |
| Conflicting role dates | Clarifies material contradiction without accusation |
| Default setup | Offers a sensible bundle, accepts changes in one reply |
| Quick start | Reduces summary/research overhead; still checks inputs |
| Ready for voice | Presents real host handoff; no fake button, automatic mic activation, or first question before cue |
| Text preference | Proceeds without repeated voice prompts |
| Voice interrupted or garbled | Retains question, clarifies meaning, does not score recognition failure |
| End-only feedback | Uses neutral follow-ups without hints or evaluative praise |
| Plain retry with end-only feedback | Repeats the same question without hints or targets; defers comparisons to debrief; preserves question count and unaided status |
| Strong concise answer | Acknowledges neutrally and moves on when enough evidence exists |
| Weak polished answer | Probes substance rather than rewarding polish |
| Early-career or career-change user | Accepts transferable examples and calibrates to actual role |
| Nontechnical role | Uses profession-appropriate scenarios, not automatic coding tests |
| Panel | One speaker and one question per turn |
| Pause, repeat, skip | Correct state transition; no question inflation or automatic failing grade |
| Early end, no answers | Honest insufficient-evidence debrief; no invented performance |
| Early end, one partial answer | Uses insufficient evidence for the overall assessment; gives only supported answer-specific feedback |
| Retry with coaching | Distinguishes assistance from unaided performance |
| New transfer question | Tests same criterion without claiming guaranteed improvement |
| Missing result metric | Uses qualitative evidence or a marked placeholder, never a fabricated number |
| Employer-specific question | Uses verified facts or clearly marked simulation assumption |
| Changed role midway | Refreshes affected analysis and avoids mixing role standards |
| Detailed voice debrief | Brief spoken summary, written detail where supported; no false silent-output promise |
| Resume another chat | Provides checkpoint; does not promise attachment transfer or persistent memory |
| Prep brief after debrief | Offers once without creating a file until accepted; reuses verified inputs and actual answer evidence |
| PDF prep brief requested | Creates a real downloadable PDF where tools support it; verifies the file and layout where rendering is available; includes concise study cues, drills, and employer questions |
| Prep brief artwork | Uses the packaged icon as a small first-page header accent without distortion; continues with a plain header if the asset is inaccessible |
| Prep brief with limited evidence | Marks untested competencies and incomplete story details; invents no performance, achievements, or improvement |
| PDF creation unavailable or failed | Explains the limit and provides the complete readable brief; never invents an attachment or download link |
| Prep brief privacy and continuity | Omits raw resumes, full transcripts, and unnecessary identifiers; uses no third-party converter; treats a later uploaded brief as a snapshot |
| Local PDF runtime | Executes the packaged generator from its installed path with the selected Python environment; does not require a particular working directory or install packages silently |
| Local PDF invalid input or output conflict | Reports the error without echoing private notes, overwriting an existing file, or claiming success; offers correction or readable text |
| Local PDF unsupported language font | Uses compatible supplied TrueType fonts or reports the limitation and preserves original-language text; no silent missing-glyph boxes or translation |
| Desktop-only package | Both manifests declare local execution; ZIP contains the generator, dependency file, icon, and instructions, without an MCP server or maintainer tests |
| Files and metadata | Valid JSON/YAML, synchronized manifests, contained references, preserved identity and audience |

Use existing user testing where it covers the relevant scenarios. After behavior changes, run targeted checks of the affected paths; repeat broader text, voice, or role coverage when changes or unresolved issues warrant it. Report any untested surfaces explicitly when describing validation.
