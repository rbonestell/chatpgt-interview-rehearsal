import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
await mkdir("dist", { recursive: true });
const ui = await build({
  entryPoints: ["ui/main.tsx"], bundle: true, write: false, minify: true,
  format: "iife", platform: "browser", target: "es2022", define: { "process.env.NODE_ENV": '"production"' },
});
const script = ui.outputFiles.find(f => f.path.endsWith(".js")) ?? ui.outputFiles[0];
const css = await readFile("ui/styles.css", "utf8");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Interview Rehearsal</title><style>${css}</style></head><body><div id="root"></div><script>${script.text.replaceAll("</script", "<\\/script")}</script></body></html>`;
await writeFile("dist/workspace.html", html);
await build({ entryPoints: ["server/index.ts"], outfile: "dist/server/index.js", bundle: true,
  platform: "node", format: "esm", target: "node24", packages: "external" });
console.log("Built self-contained workspace HTML and local MCP server.");
