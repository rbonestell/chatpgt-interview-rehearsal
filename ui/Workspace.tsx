import { useState, useSyncExternalStore, type FormEvent } from "react";
import { availableActions, settingsSchema, sourceLabels, stageLabels, type Action, type ActionType, type Settings, type Snapshot } from "../shared/workspace.js";
import { WorkspaceController } from "./controller.js";

type Act = (action: Action) => void;
function Summary({ snapshot: s }: { snapshot: Snapshot }) {
  return <dl className="summary">
    <div><dt>Stage</dt><dd>{stageLabels[s.settings.stage]}</dd></div>
    <div><dt>Length</dt><dd>{s.settings.questionCount} main questions</dd></div>
    <div><dt>Difficulty</dt><dd>{s.settings.difficulty}</dd></div>
    <div><dt>Feedback</dt><dd>{s.settings.feedback === "at-end" ? "At the end" : "After each answer"}</dd></div>
    <div><dt>Preference</dt><dd>{s.settings.mode === "voice" ? "Voice recommended" : "Text"}</dd></div>
    {s.settings.focus && <div><dt>Focus</dt><dd>{s.settings.focus}</dd></div>}
  </dl>;
}
function Preparation({ snapshot: s, act, disabled }: { snapshot: Snapshot; act: Act; disabled: boolean }) {
  const missing = s.sources.job !== "read" && s.sources.job !== "limited" ? "job description" : "background";
  return <section aria-labelledby="prep-title"><h2 id="prep-title">Prepare for your interview</h2>
    <ul className="checklist"><li><span>Job description</span><strong>{sourceLabels[s.sources.job]}</strong></li>
      <li><span>Professional background</span><strong>{sourceLabels[s.sources.background]}</strong></li></ul>
    <p>Use the chat’s attachment control or paste a link or readable text in the composer. Redact contact details and confidential information.</p>
    {s.limitedInput && <p>Limited-input practice: questions use only the material you agreed to provide.</p>}
    <button disabled={disabled} onClick={() => act({ type: "continue" })}>{Object.values(s.sources).every(v => v === "read" || v === "limited") ? "Review role and setup" : `Help me add my ${missing}`}</button>
  </section>;
}
function Setup({ snapshot: s, act, disabled }: { snapshot: Snapshot; act: Act; disabled: boolean }) {
  const [draft, setDraft] = useState<Settings>(s.settings);
  const [error, setError] = useState("");
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setDraft(d => ({ ...d, [key]: value }));
  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = settingsSchema.safeParse(draft);
    if (!parsed.success) { setError("Choose 1–20 questions and keep the focus under 160 characters."); return; }
    setError(""); act({ type: "configure", settings: parsed.data });
  }
  return <section aria-labelledby="setup-title"><h2 id="setup-title">Shape your interview</h2><p>Use the recommendation or adjust it. Follow-ups don’t count as main questions.</p>
    <form onSubmit={submit}><fieldset disabled={disabled}><legend className="sr-only">Interview setup</legend><div className="fields">
      <label>Interview stage<select aria-label="Interview stage" value={draft.stage} onChange={e => update("stage", e.target.value as Settings["stage"])}>{Object.entries(stageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Main questions<input type="number" min="1" max="20" required value={draft.questionCount} onChange={e => update("questionCount", Number(e.target.value))}/></label>
      <label>Difficulty<select aria-label="Difficulty" value={draft.difficulty} onChange={e => update("difficulty", e.target.value as Settings["difficulty"])}>{["supportive", "realistic", "tough"].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Feedback timing<select aria-label="Feedback timing" value={draft.feedback} onChange={e => update("feedback", e.target.value as Settings["feedback"])}><option value="at-end">At the end</option><option value="after-each">After each answer</option></select></label>
      <label>How to practice<select aria-label="How to practice" value={draft.mode} onChange={e => update("mode", e.target.value as Settings["mode"])}><option value="voice">Voice — recommended</option><option value="text">Text</option></select></label>
      <label>Focus (optional)<input maxLength={160} value={draft.focus} onChange={e => update("focus", e.target.value)} placeholder="e.g. explaining tradeoffs"/></label>
    </div><p className="muted">Pacing depends on your replies. Voice is a preference; you enable it in ChatGPT.</p>
      <div className="actions"><button className="primary" type="submit">Confirm setup</button><button type="button" onClick={() => act({ type: "configure", settings: s.settings })}>Use recommended setup</button></div>
    </fieldset>{error && <p role="alert">{error}</p>}</form>
  </section>;
}
function Ready({ snapshot: s, act, disabled }: { snapshot: Snapshot; act: Act; disabled: boolean }) {
  return <section aria-labelledby="ready-title"><h2 id="ready-title">Your interview is ready</h2><Summary snapshot={s}/>
    <p>{s.limitedInput ? "Limited-input practice agreed." : "Job description and background read."} This is a practice simulation.</p>
    <div className="actions"><button className={s.settings.mode === "voice" ? "primary" : ""} disabled={disabled} onClick={() => act({ type: "prepare-voice" })}>Prepare for voice interview</button>
      <button className={s.settings.mode === "text" ? "primary" : ""} disabled={disabled} onClick={() => act({ type: "start-text" })}>Start in text</button>
      <button disabled={disabled} onClick={() => act({ type: "edit" })}>Edit setup</button></div>
    <p className="handoff">For voice: select <strong>Start voice chat</strong> in this conversation, then say “Begin interview.” You can use an equivalent start cue.</p>
    <p className="muted">Voice availability depends on your ChatGPT client and account. You can continue in text with the same setup.</p>
  </section>;
}
const controlLabels: Partial<Record<ActionType, string>> = { pause: "Pause", resume: "Resume", repeat: "Repeat question", retry: "Retry answer", skip: "Skip question", end: "End interview" };
function Session({ snapshot: s, act, disabled }: { snapshot: Snapshot; act: Act; disabled: boolean }) {
  const allowed = availableActions(s);
  return <section aria-labelledby="session-title"><h2 id="session-title">{s.status === "paused" ? "Interview paused" : s.phase === "practice" ? "Practice in progress" : "Interview in progress"}</h2>
    <p className="progress">Main question {s.questionNumber} of {s.settings.questionCount}</p>
    <p>{s.settings.feedback === "at-end" ? "Feedback stays at the end. Retrying alone does not request hints." : "Brief feedback follows each answer."}</p>
    <div className="actions">{Object.entries(controlLabels).filter(([type]) => allowed.includes(type as ActionType)).map(([type, label]) => <button key={type} disabled={disabled} onClick={() => act({ type } as Action)}>{label}</button>)}</div>
    <p className="muted">Controls request changes in the conversation. They do not mute the microphone or stop audio. During an active response, use spoken or typed commands if buttons are unavailable.</p>
  </section>;
}
function Practice({ snapshot: s, act, disabled }: { snapshot: Snapshot; act: Act; disabled: boolean }) {
  return <section aria-labelledby="practice-title"><h2 id="practice-title">Choose your next practice</h2>
    {s.practice ? <><p>Recommended focus: <strong>{s.practice.target}</strong></p><p>Use the written debrief for the evidence and success criterion.</p>
      <div className="actions"><button className="primary" disabled={disabled} onClick={() => act({ type: "drill" })}>Start focused practice</button>
        {s.practice.questionId && <button disabled={disabled} onClick={() => act({ type: "retry", questionId: s.practice!.questionId! })}>Retry recommended answer</button>}
        <button disabled={disabled} onClick={() => act({ type: "finish" })}>Finish practice</button></div></>
      : <><p>No assessed answer supports a recommended drill yet. Continue in chat for limited-context practice or finish here.</p><button disabled={disabled} onClick={() => act({ type: "finish" })}>Finish practice</button></>}
  </section>;
}
export function Workspace({ controller }: { controller: WorkspaceController }) {
  const state = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  const s = state.snapshot;
  const disabled = !state.connected || !state.canMessage || !!state.pending || state.restored;
  const act: Act = action => { void controller.act(action); };
  return <main aria-label="Interview Rehearsal workspace"><header><span className="eyebrow">Interview Rehearsal</span>{s && <h1>{s.role}</h1>}</header>
    <div className="notice" role="status" aria-live="polite">{state.notice}</div>
    {s && <>
      {s.phase === "preparation" && <Preparation snapshot={s} act={act} disabled={disabled}/>}
      {s.phase === "setup" && <Setup key={`${s.workflowId}-${s.revision}`} snapshot={s} act={act} disabled={disabled}/>}
      {s.phase === "ready" && <Ready snapshot={s} act={act} disabled={disabled}/>}
      {(["interview", "practice"].includes(s.phase) && s.status !== "ended") && <Session snapshot={s} act={act} disabled={disabled}/>}
      {(["debrief", "practice"].includes(s.phase)) && <Practice snapshot={s} act={act} disabled={disabled}/>}
      {s.phase === "complete" && <p>Practice finished. Your debrief and verified materials remain in this conversation.</p>}
      <footer><button disabled={!state.connected || !state.canMessage || state.pending?.delivery === "sending"} onClick={() => act({ type: "refresh" })}>Refresh workspace</button><span>Use the latest card, or refresh if your interview has moved on.</span></footer>
    </>}
    {state.pending && <details><summary>Request details and recovery</summary><p>Check the conversation before resending. If necessary, paste this request into chat; keep the same action ID so it can be recognized.</p><textarea aria-label="Pending request to copy into chat" readOnly value={state.pending.message}/></details>}
    {!state.canMessage && <p>Use chat to provide materials, confirm settings, begin, pause, resume, repeat, retry, skip, end, or request a drill.</p>}
  </main>;
}
