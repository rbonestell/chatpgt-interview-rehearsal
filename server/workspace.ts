import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { snapshotSummary, toolSchema } from "../shared/workspace.js";
import { VERSION } from "../shared/version.js";

export const RESOURCE_URI = "ui://interview-rehearsal/workspace-v1.html";

export function createWorkspaceServer(html: string, uiDomain?: string): McpServer {
  const server = new McpServer({ name: "interview-rehearsal", version: VERSION });
  const meta = { ui: {
    csp: { connectDomains: [], resourceDomains: [], frameDomains: [], baseUriDomains: [] },
    ...(uiDomain ? { domain: uiDomain } : {}),
    prefersBorder: true,
  } };
  registerAppResource(server, "Interview workspace", RESOURCE_URI, { _meta: meta }, async () => ({
    contents: [{ uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html, _meta: meta }],
  }));
  registerAppTool(server, "show_interview_workspace", {
    title: "Show interview workspace",
    description: "Render the conversation's acknowledged interview workflow as an optional workspace. Supply only minimal workflow metadata and short professional labels, never resumes, answers, contact details, or transcripts. This tool validates and echoes a snapshot; it does not start, pause, or store an interview, assess evidence, or activate voice. Keep the written summary available without UI.",
    inputSchema: toolSchema.shape,
    outputSchema: toolSchema.shape,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: { ui: { resourceUri: RESOURCE_URI, visibility: ["model"] } },
  }, async (args) => {
    const { snapshot } = toolSchema.parse(args);
    return { content: [{ type: "text", text: snapshotSummary(snapshot) }], structuredContent: { snapshot } };
  });
  return server;
}
