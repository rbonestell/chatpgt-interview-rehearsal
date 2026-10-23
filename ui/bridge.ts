import { App, applyDocumentTheme, applyHostStyleVariables } from "@modelcontextprotocol/ext-apps";
import type { Snapshot } from "../shared/workspace.js";
import type { WorkspaceController, Bridge } from "./controller.js";
import { VERSION } from "../shared/version.js";

interface OpenAICompatibility {
  widgetState?: unknown;
  toolOutput?: { snapshot?: unknown };
  setWidgetState?: (state: unknown) => void | Promise<void>;
  sendFollowUpMessage?: (args: { prompt: string }) => Promise<void>;
}
declare global { interface Window { openai?: OpenAICompatibility } }

function applyContext(context?: ReturnType<App["getHostContext"]>) {
  if (context?.theme) applyDocumentTheme(context.theme);
  if (context?.styles?.variables) applyHostStyleVariables(context.styles.variables);
  if (context?.safeAreaInsets) for (const [side, value] of Object.entries(context.safeAreaInsets)) {
    document.documentElement.style.setProperty(`--safe-${side}`, `${value}px`);
  }
}

export function createBridge(): Bridge & { connect(controller: WorkspaceController): Promise<void> } {
  const app = new App({ name: "Interview Rehearsal", version: VERSION }, {}, { autoResize: true });
  let standard = false;
  let legacy = false;
  return {
    async send(text) {
      if (standard) {
        const result = await app.sendMessage({ role: "user", content: [{ type: "text", text }] }, { timeout: 15_000 });
        if (result.isError) throw new Error("Host rejected message");
      } else if (legacy && window.openai?.sendFollowUpMessage) {
        await window.openai.sendFollowUpMessage({ prompt: text });
      } else throw new Error("Message sending unavailable");
    },
    async context(snapshot: Snapshot) {
      if (standard && app.getHostCapabilities()?.updateModelContext?.structuredContent) {
        await app.updateModelContext({ structuredContent: { interviewWorkspace: snapshot } }, { timeout: 5000 });
      }
    },
    save(state) {
      try {
        const result = window.openai?.setWidgetState?.(state);
        if (result instanceof Promise) void result.catch(() => {});
      } catch { /* Persistence is optional; never block a request. */ }
    },
    async connect(controller) {
      app.ontoolresult = result => {
        if (result.isError) { controller.receive(null); return; }
        controller.receive(result.structuredContent?.snapshot);
      };
      app.ontoolcancelled = () => controller.receive(null);
      app.onhostcontextchanged = context => applyContext(context);
      try {
        await app.connect(undefined, { timeout: 8000 });
        standard = !!app.getHostCapabilities()?.message?.text;
        applyContext(app.getHostContext());
        // Capability fallback only; never send a second message after an uncertain send.
        legacy = !standard && !!window.openai?.sendFollowUpMessage;
        controller.connect(standard || legacy);
      } catch {
        legacy = !!window.openai?.sendFollowUpMessage;
        if (!legacy) { controller.fail(); return; }
        controller.connect(true);
      }
      if (legacy) {
        const receiveLegacy = () => {
          if (window.openai?.toolOutput?.snapshot) controller.receive(window.openai.toolOutput.snapshot);
        };
        window.addEventListener("openai:set_globals", receiveLegacy);
        receiveLegacy();
      }
    },
  };
}
