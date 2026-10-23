import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { build } from "esbuild";

// Use Wrangler's actual workerd runtime and deployment configuration, not a Node mock.
const child = spawn(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "dev", "--local", "--port", "8799", "--persist-to", "temp/worker-state"], {
  stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
});
let output = "";
child.stdout.on("data", chunk => { output += chunk.toString(); });
child.stderr.on("data", chunk => { output += chunk.toString(); });
const endpoint = "http://127.0.0.1:8799";
const client = new Client({ name: "fictional-worker-smoke-test", version: "1" });
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error(`Worker runtime exited: ${output}`);
    try {
      const response = await fetch(`${endpoint}/health`, { signal: AbortSignal.timeout(500) });
      if (response.ok && (await response.text()) === "ok") { ready = true; break; }
    } catch { /* Wait only for the local runtime to start. */ }
    await setTimeout(250);
  }
  assert.ok(ready, `Worker did not start: ${output}`);
  await client.connect(new StreamableHTTPClientTransport(new URL(`${endpoint}/mcp`)));
  const tools = await client.listTools();
  assert.equal(tools.tools[0].name, "show_interview_workspace");
  // Load the same typed fictional snapshot used by the protocol tests.
  const fixture = await build({ entryPoints: ["tests/fixtures.ts"], bundle: true, write: false, format: "esm", platform: "node" });
  const { snapshot } = await import(`data:text/javascript;base64,${Buffer.from(fixture.outputFiles[0].text).toString("base64")}`);
  const result = await client.callTool({ name: "show_interview_workspace", arguments: { snapshot: snapshot() } });
  assert.equal(result.isError, undefined, JSON.stringify(result));
  assert.deepEqual(result.structuredContent.snapshot, snapshot());
  const resource = await client.readResource({ uri: tools.tools[0]._meta.ui.resourceUri });
  assert.equal(resource.contents[0].mimeType, "text/html;profile=mcp-app");
  assert.ok(resource.contents[0].text.includes("Interview Rehearsal"));
  const blocked = await fetch(`${endpoint}/mcp`, { method: "POST", headers: { Origin: "https://untrusted.test" } });
  assert.equal(blocked.status, 403);
  console.log("Cloudflare workerd smoke test passed: initialization, discovery, tool execution, HTML resource, and origin protection.");
} finally {
  await client.close();
  const exited = new Promise(resolve => child.once("exit", resolve));
  child.kill("SIGTERM");
  await exited;
}
