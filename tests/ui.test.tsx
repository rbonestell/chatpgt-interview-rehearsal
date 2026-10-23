import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { Workspace } from "../ui/Workspace.js";
import { WorkspaceController } from "../ui/controller.js";
import { snapshot } from "./fixtures.js";
import type { Snapshot } from "../shared/workspace.js";

function render(s: Snapshot) {
  const c = new WorkspaceController({ async send() {}, async context() {}, save() {} });
  c.connect(true); c.receive(s);
  return renderToStaticMarkup(<Workspace controller={c}/>);
}
test("all five views have real actions, labeled fields, progress, and truthful voice guidance", () => {
  assert.match(render(snapshot({ phase: "preparation", confirmed: false, sources: { job: "replacement", background: "needed" } })), /Help me add my job description/);
  const setup = render(snapshot({ phase: "setup", confirmed: false }));
  for (const label of ["Interview stage", "Main questions", "Difficulty", "Feedback timing", "Focus (optional)"]) assert.ok(setup.includes(label));
  const ready = render(snapshot());
  assert.match(ready, /Prepare for voice interview/);
  assert.match(ready, /Start in text/);
  assert.match(ready, /select <strong>Start voice chat/);
  const session = render(snapshot({ phase: "interview", status: "paused", questionNumber: 2, pendingQuestionId: "q2" }));
  for (const label of ["Resume", "Repeat question", "Retry answer", "Skip question", "End interview"]) assert.ok(session.includes(label));
  const practice = render(snapshot({ phase: "debrief", status: "ended", questionNumber: 5, practice: { target: "Explaining tradeoffs", questionId: "q2" } }));
  assert.match(practice, /Start focused practice/);
  assert.match(practice, /Retry recommended answer/);
  assert.match(practice, /Finish practice/);
});
test("untrusted labels render as escaped text, never HTML", () => {
  const html = render(snapshot({ role: "<img src=x onerror=alert(1)>" }));
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;img"));
});
