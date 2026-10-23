import { test } from "node:test";
import assert from "node:assert/strict";
// JavaScript build scripts are intentionally executable without a TypeScript runtime.
// @ts-expect-error Plain ESM script has no declaration file.
import { remoteConfig } from "../scripts/configure-mcp.mjs";

test("portable configuration keeps the verified domain and rejects local/placeholder/credential URLs", () => {
  const config = remoteConfig("https://chatgpt-interview-rehearsal-mcp.rbonestell.com/mcp");
  assert.equal(config.mcpServers["interview-workspace"].type, "streamable-http");
  assert.equal(config.mcpServers["interview-workspace"].extensions["com.openai"].auth.type, "none");
  for (const url of ["http://localhost:8787/mcp", "https://example.com/mcp", "https://127.0.0.1/mcp", "https://user:secret@host.com/mcp", "https://host.com/mcp?key=secret", "https://host.com/path"]) {
    assert.throws(() => remoteConfig(url));
  }
});
