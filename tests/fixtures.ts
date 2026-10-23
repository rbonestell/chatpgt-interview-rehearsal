import type { Snapshot } from "../shared/workspace.js";

export function snapshot(patch: Partial<Snapshot> = {}): Snapshot {
  return {
    schemaVersion: 1, workflowId: "fictional-session", revision: 1, phase: "ready", role: "Operations manager",
    sources: { job: "read", background: "read" }, limitedInput: false,
    settings: { stage: "hiring-manager", questionCount: 5, difficulty: "realistic", feedback: "at-end", focus: "", mode: "voice" },
    confirmed: true, status: "idle", questionNumber: 0, pendingQuestionId: null, practice: null, acknowledgment: null,
    ...patch,
  };
}
