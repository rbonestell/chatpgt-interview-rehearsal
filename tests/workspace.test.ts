import { test } from "node:test";
import assert from "node:assert/strict";
import { actionMessage, availableActions, snapshotSchema } from "../shared/workspace.js";
import { WorkspaceController, type Bridge } from "../ui/controller.js";
import { snapshot } from "./fixtures.js";

function harness(send: Bridge["send"] = async () => {}) {
  const messages: string[] = [];
  let saved: unknown;
  const controller = new WorkspaceController({ send: async text => { messages.push(text); await send(text); }, context: async () => {}, save: state => { saved = state; } });
  controller.connect(true);
  controller.receive(snapshot());
  return { controller, messages, saved: () => saved };
}

test("schema rejects unread readiness, invalid counts, unaccepted limitations, extra private fields", () => {
  assert.equal(snapshotSchema.safeParse(snapshot({ sources: { job: "reading", background: "read" } })).success, false);
  assert.equal(snapshotSchema.safeParse(snapshot({ questionNumber: 6 })).success, false);
  assert.equal(snapshotSchema.safeParse(snapshot({ sources: { job: "limited", background: "read" } })).success, false);
  assert.equal(snapshotSchema.safeParse({ ...snapshot(), resume: "private source text" }).success, false);
  assert.equal(snapshotSchema.safeParse(snapshot({ role: "x".repeat(161) })).success, false);
  assert.equal(snapshotSchema.safeParse(snapshot({ status: "paused" })).success, false);
});

test("one voice click sends a start-cue wait request, remains ready, and suppresses repeated clicks", async () => {
  let resolve!: () => void;
  const h = harness(() => new Promise(r => { resolve = r; }));
  const sending = h.controller.act({ type: "prepare-voice" });
  await h.controller.act({ type: "prepare-voice" });
  await h.controller.act({ type: "refresh" });
  assert.equal(h.messages.length, 1);
  assert.match(h.messages[0], /Wait for my start cue/);
  assert.equal(h.controller.state.snapshot?.status, "idle");
  resolve(); await sending;
  assert.equal(h.controller.state.pending?.delivery, "sent");
  assert.equal(h.controller.state.snapshot?.phase, "ready");
});

test("only a matching higher revision acknowledgment clears pending state", async () => {
  const h = harness();
  await h.controller.act({ type: "start-text" });
  const actionId = h.controller.state.pending!.actionId;
  h.controller.receive(snapshot({ acknowledgment: { actionId, outcome: "accepted" } }));
  assert.ok(h.controller.state.pending);
  h.controller.receive(snapshot({ revision: 2, acknowledgment: { actionId: "different", outcome: "accepted" } }));
  assert.ok(h.controller.state.pending);
  h.controller.receive(snapshot({ revision: 3, phase: "interview", status: "running", questionNumber: 1, pendingQuestionId: "q1", acknowledgment: { actionId, outcome: "accepted" } }));
  assert.equal(h.controller.state.pending, null);
  assert.equal(h.controller.state.snapshot?.phase, "interview");
  h.controller.receive(snapshot({ revision: 1 }));
  assert.equal(h.controller.state.snapshot?.revision, 3);
  h.controller.receive(snapshot({ workflowId: "other-session", revision: 10 }));
  assert.equal(h.controller.state.snapshot?.workflowId, "fictional-session");
});

test("uncertain delivery is never automatically retried; refresh requests state only", async () => {
  const h = harness(async () => { throw new Error("transport disconnected"); });
  await h.controller.act({ type: "start-text" });
  assert.equal(h.controller.state.pending?.delivery, "uncertain");
  await h.controller.act({ type: "start-text" });
  assert.equal(h.messages.length, 1);
  await h.controller.act({ type: "refresh" });
  assert.equal(h.messages.length, 2);
  assert.match(h.messages[1], /without changing progress or replaying any action/);
});

test("restored widgets require fresh output and preserve uncertain pending requests", async () => {
  const h = harness();
  await h.controller.act({ type: "prepare-voice" });
  const restored = new WorkspaceController({ send: async () => { assert.fail("must not send"); }, context: async () => {}, save() {} }, h.saved());
  restored.connect(true);
  await restored.act({ type: "start-text" });
  assert.equal(restored.state.restored, true);
  restored.receive(snapshot());
  assert.equal(restored.state.restored, false);
  assert.ok(restored.state.pending);
});

test("acknowledgment arriving before send resolves does not restore pending state", async () => {
  let resolve!: () => void;
  const h = harness(() => new Promise(r => { resolve = r; }));
  const sending = h.controller.act({ type: "start-text" });
  const actionId = h.controller.state.pending!.actionId;
  h.controller.receive(snapshot({ revision: 2, acknowledgment: { actionId, outcome: "accepted" } }));
  resolve(); await sending;
  assert.equal(h.controller.state.pending, null);
});

test("session controls are phase-specific and preserve retry semantics in the message", () => {
  const running = snapshot({ phase: "interview", status: "running", questionNumber: 2, pendingQuestionId: "q2" });
  assert.ok(availableActions(running).includes("pause"));
  assert.ok(!availableActions(running).includes("resume"));
  assert.ok(availableActions({ ...running, status: "paused" }).includes("resume"));
  const message = actionMessage(running, { type: "retry" }, "action-1");
  assert.match(message, /end-only retry does not request coaching/);
  assert.match(message, /main-question count/);
  assert.throws(() => actionMessage(running, { type: "start-text" }, "a"));
  assert.ok(!availableActions(snapshot({ phase: "debrief", status: "ended" })).includes("drill"));
  const practice = snapshot({ phase: "practice", status: "running", questionNumber: 2, pendingQuestionId: "drill1", practice: { target: "Tradeoffs", questionId: "q2" } });
  assert.match(actionMessage(practice, { type: "retry", questionId: "q2" }, "a"), /Retry question ID q2/);
  assert.throws(() => actionMessage(practice, { type: "retry", questionId: "unseen" }, "a"));
});

test("same-revision conflicting output cannot replace confirmed progress", () => {
  const h = harness();
  h.controller.receive(snapshot({ phase: "interview", status: "running", questionNumber: 1, pendingQuestionId: "q1" }));
  assert.equal(h.controller.state.snapshot?.phase, "ready");
  assert.equal(h.controller.state.restored, true);
});

test("host lacking messaging preserves readable snapshot and ignores clicks", async () => {
  const h = harness(); h.controller.connect(false);
  await h.controller.act({ type: "start-text" });
  assert.equal(h.messages.length, 0);
  assert.ok(h.controller.state.snapshot);
});
