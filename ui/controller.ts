import { z } from "zod";
import { actionMessage, actionSchema, availableActions, snapshotSchema, type Action, type Snapshot } from "../shared/workspace.js";

const pendingSchema = z.strictObject({
  actionId: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
  baseRevision: z.number().int().nonnegative(),
  type: actionSchema,
  message: z.string().max(4000),
  delivery: z.enum(["sending", "sent", "uncertain"]),
});
const persistedSchema = z.strictObject({ snapshot: snapshotSchema, pending: pendingSchema.nullable() });
type Pending = z.infer<typeof pendingSchema>;
export interface WorkspaceState {
  snapshot: Snapshot | null;
  pending: Pending | null;
  restored: boolean;
  connected: boolean;
  canMessage: boolean;
  notice: string;
}
export interface Bridge {
  send(text: string): Promise<void>;
  context(snapshot: Snapshot): Promise<void>;
  save(state: unknown): void;
}

export class WorkspaceController {
  state: WorkspaceState = { snapshot: null, pending: null, restored: false, connected: false, canMessage: false, notice: "Connecting to the interview workspace…" };
  private listeners = new Set<() => void>();
  constructor(private bridge: Bridge, restored?: unknown) {
    const parsed = persistedSchema.safeParse(restored);
    if (parsed.success) this.state = { ...this.state, ...parsed.data, restored: true, notice: "Restored view. Waiting for a fresh conversation snapshot before enabling controls." };
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getState = () => this.state;
  private update(patch: Partial<WorkspaceState>) {
    this.state = { ...this.state, ...patch };
    if (this.state.snapshot) this.bridge.save({ snapshot: this.state.snapshot, pending: this.state.pending });
    this.listeners.forEach(listener => listener());
  }
  connect(canMessage: boolean) {
    this.update({ connected: true, canMessage, notice: canMessage ? (this.state.restored || this.state.snapshot ? this.state.notice : "Ready for a conversation snapshot.") : "This host cannot send button requests. Use the same commands in chat." });
  }
  fail() {
    this.update({ connected: false, canMessage: false, notice: "The workspace connection is unavailable. Continue in chat; your interview progress remains in the conversation." });
  }
  receive(value: unknown) {
    const parsed = snapshotSchema.safeParse(value);
    if (!parsed.success) { this.update({ restored: true, notice: "The workspace update was invalid. Request a fresh workspace in chat." }); return; }
    const next = parsed.data;
    const current = this.state.snapshot;
    if (current && (current.workflowId !== next.workflowId || next.revision < current.revision)) return;
    if (current && next.revision === current.revision && JSON.stringify(current) !== JSON.stringify(next)) {
      this.update({ restored: true, notice: "This update conflicts with the displayed interview state. Refresh the workspace before choosing an action." });
      return;
    }
    const pending = this.state.pending;
    const acknowledged = pending && next.revision > pending.baseRevision && next.acknowledgment?.actionId === pending.actionId;
    // Re-rendering the same result must not accidentally acknowledge an action.
    this.update({ snapshot: next, restored: false, pending: acknowledged ? null : pending,
      notice: acknowledged
        ? next.acknowledgment?.outcome === "accepted" ? "Conversation updated." : "The conversation rejected this request. Review the latest state before choosing again."
        : pending ? "Waiting for the conversation to acknowledge your request. Use Refresh if the response has finished without updating this card."
          : "Use this card or the same commands in chat. Earlier cards may be out of date.",
    });
    // Best-effort context only. A message carries all required action metadata.
    void this.bridge.context(next).catch(() => {});
  }
  async act(action: Action) {
    const s = this.state.snapshot;
    if (!s || !this.state.connected || !this.state.canMessage) return;
    if (this.state.pending?.delivery === "sending") return;
    if ((this.state.pending || this.state.restored) && action.type !== "refresh") return;
    if (!availableActions(s).includes(action.type)) return;
    const actionId = crypto.randomUUID();
    const message = actionMessage(s, action, actionId);
    const pending: Pending = { actionId, baseRevision: s.revision, type: action, message, delivery: "sending" };
    this.update({ pending, notice: "Sending request. Waiting for conversation acknowledgment…" });
    try {
      await this.bridge.send(message);
      // A host may deliver the acknowledgment before the send promise resolves.
      if (this.state.pending?.actionId === actionId) this.update({ pending: { ...pending, delivery: "sent" }, notice: action.type === "prepare-voice"
        ? "Voice preparation requested. Select Start voice chat in this conversation, then say ‘Begin interview.’ Waiting for confirmation of the saved setup."
        : "Request sent. Waiting for conversation acknowledgment…" });
    } catch {
      if (this.state.pending?.actionId === actionId) this.update({ pending: { ...pending, delivery: "uncertain" }, notice: "Delivery could not be confirmed. Check the chat before sending anything again. Refresh requests the current state without replaying this action." });
    }
  }
}
