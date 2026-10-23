import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createWorkspaceServer } from "./workspace.js";

export interface ServerOptions { html: string; uiDomain?: string; allowedOrigins?: string[] }

// Each request gets a fresh transport and server. No user/session state is shared.
export async function handleRequest(request: Request, options: ServerOptions): Promise<Response> {
  const headers = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && !(options.allowedOrigins ?? []).includes(origin)) return new Response("Origin not allowed", { status: 403, headers });
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "content-type, mcp-protocol-version, mcp-session-id, accept, last-event-id");
  }
  if (url.pathname === "/health" && request.method === "GET") return new Response("ok", { headers });
  if (url.pathname !== "/mcp") return new Response("Not found", { status: 404, headers });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") {
    headers.set("Allow", "POST, OPTIONS");
    return new Response("This stateless MCP endpoint accepts POST requests.", { status: 405, headers });
  }
  const server = createWorkspaceServer(options.html, options.uiDomain);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, enableJsonResponse: true, maxRequestBodySize: 32 * 1024,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    // JSON mode fully resolves requests here; no SSE/pushed work outlives the response.
    const body = await response.arrayBuffer();
    response.headers.forEach((value, key) => headers.set(key, value));
    headers.set("Cache-Control", "no-store");
    return new Response(body.byteLength ? body : null, { status: response.status, headers });
  } catch {
    // Do not log request bodies or exception objects, which can contain tool arguments.
    return new Response("MCP request failed", { status: 500, headers });
  } finally {
    await server.close();
  }
}
