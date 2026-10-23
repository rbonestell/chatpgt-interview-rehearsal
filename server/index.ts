import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { handleRequest } from "./http.js";

const html = await readFile(new URL("../workspace.html", import.meta.url), "utf8");
const port = Number(process.env.PORT ?? 8787);
const hostname = process.env.HOST ?? "127.0.0.1";
const server = createServer(async (req, res) => {
  // Local listener rejects foreign Host headers to prevent DNS rebinding.
  if (![`${hostname}:${port}`, `localhost:${port}`, `127.0.0.1:${port}`].includes(req.headers.host ?? "")) {
    res.writeHead(403).end("Host not allowed"); return;
  }
  const request = new Request(`http://${hostname}:${port}${req.url ?? "/"}`, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    ...(req.method === "POST" ? { body: Readable.toWeb(req) as ReadableStream, duplex: "half" } : {}),
  } as RequestInit);
  const response = await handleRequest(request, {
    html, uiDomain: process.env.UI_DOMAIN,
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean),
  });
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
});
server.requestTimeout = 30_000;
server.listen(port, hostname, () => console.log(`Interview workspace: http://${hostname}:${port}/mcp`));
