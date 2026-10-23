import { writeFile } from "node:fs/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import metadata from "../package.json" with { type: "json" };

export function remoteConfig(endpoint) {
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/mcp"
    || !url.hostname.includes(".") || /(^|\.)(localhost|example\.(com|org|net)|invalid|test)$/.test(url.hostname)
    || /^[\d.]+$/.test(url.hostname) || url.hostname.includes(":")) {
    throw new Error("Provide the deployed HTTPS /mcp endpoint without credentials, query, or fragment.");
  }
  return {
    $schema: "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
    mcpServers: { "interview-workspace": { type: "streamable-http", url: url.href,
      extensions: { "com.openai": { auth: { type: "none" } } } } },
  };
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  try {
    const endpoint = process.argv[2];
    if (!endpoint) throw new Error("Usage: npm run configure:mcp -- https://YOUR-DEPLOYED-HOST/mcp");
    const config = remoteConfig(endpoint);
    const response = await fetch(new URL("/health", endpoint), { signal: AbortSignal.timeout(10_000), redirect: "error" });
    if (!response.ok || (await response.text()).trim() !== "ok") throw new Error("Endpoint health check failed.");
    const client = new Client({ name: "interview-rehearsal-package-check", version: metadata.version });
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)), { timeout: 10_000 });
      if (client.getServerVersion()?.version !== metadata.version) throw new Error("Deployed Worker version differs from the package version.");
      const tools = await client.listTools({}, { timeout: 10_000 });
      const tool = tools.tools.find(t => t.name === "show_interview_workspace");
      const uri = tool?._meta?.ui?.resourceUri;
      if (!uri) throw new Error("Interview workspace tool or UI association not found.");
      const resource = await client.readResource({ uri }, { timeout: 10_000 });
      if (!resource.contents.some(c => c.mimeType === "text/html;profile=mcp-app" && typeof c.text === "string")) throw new Error("Workspace HTML resource not found.");
    } finally { await client.close(); }
    await writeFile("mcp.json", `${JSON.stringify(config, null, 2)}\n`);
    console.log("Verified deployed version, tool discovery, and UI resource; synchronized mcp.json. Run npm run bundle to package it.");
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
