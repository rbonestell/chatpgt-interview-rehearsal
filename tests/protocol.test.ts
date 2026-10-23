import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createWorkspaceServer, RESOURCE_URI } from "../server/workspace.js";
import { handleRequest } from "../server/http.js";
import { snapshot } from "./fixtures.js";

test("MCP client discovers model-only rendering tool, validates output, reads restrictive UI resource", async () => {
  const server = createWorkspaceServer("<!doctype html><h1>Interview</h1>");
  const client = new Client({ name: "fictional-test-client", version: "1" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a); await client.connect(b);
  try {
    const tools = await client.listTools();
    assert.equal(tools.tools.length, 1);
    assert.deepEqual(tools.tools[0]._meta?.ui, { resourceUri: RESOURCE_URI, visibility: ["model"] });
    assert.equal(tools.tools[0].annotations?.readOnlyHint, true);
    const result = await client.callTool({ name: "show_interview_workspace", arguments: { snapshot: snapshot() } });
    assert.deepEqual(result.structuredContent, { snapshot: snapshot() });
    assert.match(JSON.stringify(result.content), /not host voice state/);
    const invalid = await client.callTool({ name: "show_interview_workspace", arguments: { snapshot: { ...snapshot(), resume: "private" } } });
    assert.equal(invalid.isError, true);
    const resource = await client.readResource({ uri: RESOURCE_URI });
    assert.equal(resource.contents[0].mimeType, "text/html;profile=mcp-app");
    assert.deepEqual((resource.contents[0]._meta?.ui as { csp: unknown }).csp, { connectDomains: [], resourceDomains: [], frameDomains: [], baseUriDomains: [] });
    const legacy = await client.readResource({ uri: "ui://interview-rehearsal/workspace-v1.html" });
    const legacyContent = legacy.contents[0];
    const currentContent = resource.contents[0];
    assert.ok("text" in legacyContent && "text" in currentContent);
    assert.equal(legacyContent.text, currentContent.text);
  } finally { await client.close(); await server.close(); }
});

const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream", "MCP-Protocol-Version": "2025-11-25" };
async function rpc(method: string, params?: unknown) {
  const request = new Request("https://worker.test/mcp", { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  return handleRequest(request, { html: "<p>UI</p>" });
}
test("stateless HTTP initializes, discovers tools, and isolates successive requests", async () => {
  const init = await rpc("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test", version: "1" } });
  assert.equal(init.status, 200);
  assert.ok((await init.json()).result.serverInfo);
  assert.equal(init.headers.get("mcp-session-id"), null);
  const tools = await rpc("tools/list");
  assert.equal(tools.status, 200);
  assert.equal((await tools.json()).result.tools[0].name, "show_interview_workspace");
  for (const role of ["Operations manager", "Lab technician"]) {
    const result = await rpc("tools/call", { name: "show_interview_workspace", arguments: { snapshot: snapshot({ role }) } });
    assert.equal((await result.json()).result.structuredContent.snapshot.role, role);
    assert.equal(result.headers.get("cache-control"), "no-store");
  }
});

test("HTTP rejects cross-origin browser calls, malformed data, oversized requests, and SSE", async () => {
  const rejected = await handleRequest(new Request("https://worker.test/mcp", { method: "POST", headers: { ...headers, Origin: "https://untrusted.test" }, body: "{}" }), { html: "ui" });
  assert.equal(rejected.status, 403);
  assert.equal((await handleRequest(new Request("https://worker.test/mcp"), { html: "ui" })).status, 405);
  const malformed = await handleRequest(new Request("https://worker.test/mcp", { method: "POST", headers, body: "{" }), { html: "ui" });
  assert.equal(malformed.status, 400);
  const oversized = await handleRequest(new Request("https://worker.test/mcp", { method: "POST", headers, body: "x".repeat(33 * 1024) }), { html: "ui" });
  assert.equal(oversized.status, 413);
});
