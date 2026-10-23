// Local host harness, not an emulator of ChatGPT or its native voice interface.
import { build } from "esbuild";
import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

const widget = await readFile("dist/workspace.html", "utf8");
const host = await build({ stdin: { resolveDir: process.cwd(), contents: `
  import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';
  import { PostMessageTransport } from '@modelcontextprotocol/ext-apps';
  import { snapshot } from './tests/fixtures.ts';
  const iframe = document.getElementById('widget');
  const mode = new URLSearchParams(location.search).get('mode');
  const state = window.testHost = { messages: [], contexts: [], saved: undefined, hold: false, reject: false, compat: mode === 'compat',
    snapshot: snapshot({ phase: 'preparation', confirmed: false, sources: { job: 'needed', background: 'needed' } }),
    async publish(patch) { state.snapshot = { ...state.snapshot, ...patch }; await bridge.sendToolResult({ content: [], structuredContent: { snapshot: state.snapshot } }); },
    theme(theme) { bridge.setHostContext({ theme, safeAreaInsets: { top: 4, bottom: 4, left: 4, right: 4 } }); },
    reload() { iframe.contentWindow.location.reload(); },
  };
  const bridge = new AppBridge(null, {name: 'local-browser-harness',version: '1'}, {
    ...(['no-message','compat'].includes(mode) ? {} : { message: { text: {} } }), updateModelContext: { structuredContent: {} }
  });
  bridge.onmessage = async ({ content }) => { state.messages.push(content[0].text); return state.reject ? { isError: true } : {}; };
  bridge.onupdatemodelcontext = async value => { state.contexts.push(value); return {}; };
  bridge.oninitialized = () => { if (!state.hold) void state.publish({}); };
  await bridge.connect(new PostMessageTransport(iframe.contentWindow, iframe.contentWindow));
  state.theme('light');
  iframe.src = '/widget';
` }, bundle: true, write: false, format: "esm", platform: "browser" });
const hostHtml = `<!doctype html><html><head><title>Local MCP Apps harness</title><style>body{margin:0}iframe{width:100%;height:1200px;border:0}</style></head><body><iframe id="widget" title="Interview workspace"></iframe><script type="module">${host.outputFiles[0].text.replaceAll("</script", "<\\/script")}</script></body></html>`;
const persistedWidget = widget.replace('<script>', '<script>window.openai={widgetState:parent.testHost.saved,setWidgetState:state=>{parent.testHost.saved=state}};if(parent.testHost.compat)window.openai.sendFollowUpMessage=async({prompt})=>{parent.testHost.messages.push(prompt)};</script><script>');
const server = createServer((req, res) => {
  res.setHeader("Content-Type", "text/html");
  if (req.url === "/widget") {
    // No network access or eval needed by the bundled widget.
    res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-ancestors 'self'");
    res.end(persistedWidget);
  } else res.end(hostHtml);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.stack ?? error.message));
  await page.goto(`http://127.0.0.1:${port}`);
  const ui = page.frameLocator("#widget");
  const publish = patch => page.evaluate(p => window.testHost.publish(p), patch);
  let acknowledgedCount = 0;
  const lastMessage = async () => {
    await page.waitForFunction(count => window.testHost.messages.length > count, acknowledgedCount);
    return page.evaluate(() => window.testHost.messages.at(-1));
  };
  const acknowledge = async patch => {
    await lastMessage();
    const request = await page.evaluate(() => {
      const text = window.testHost.messages.at(-1);
      return JSON.parse(text.match(/workspace request: ([^\n]+)/)[1]);
    });
    await publish({ ...patch, revision: request.baseRevision + 1, acknowledgment: { actionId: request.actionId, outcome: "accepted" } });
    acknowledgedCount = await page.evaluate(() => window.testHost.messages.length);
  };
  await ui.getByRole("button", { name: "Help me add my job description" }).waitFor();
  // Reproduce the reported dead end: intake help must provide a visible next
  // step without sending a no-op conversation request and redrawing the card.
  await ui.getByRole("button", { name: "Help me add my job description" }).click();
  await ui.getByRole("region", { name: "Add job description" }).waitFor({ timeout: 2000 });
  assert.match(await ui.getByRole("region", { name: "Add job description" }).innerText(), /Send the message/);
  assert.equal(await page.evaluate(() => window.testHost.messages.length), 0);
  await mkdir("temp/ui", { recursive: true });
  await page.screenshot({ path: "temp/ui/preparation.png" });
  await publish({ revision: 2, phase: "setup", sources: { job: "read", background: "read" } });
  await ui.getByLabel("Main questions").fill("10");
  await ui.getByLabel("Focus (optional)").fill("Explaining tradeoffs");
  await ui.getByLabel("Difficulty", { exact: true }).selectOption("tough");
  await page.screenshot({ path: "temp/ui/setup.png" });
  await ui.getByRole("button", { name: "Confirm setup", exact: true }).click();
  const configText = await lastMessage();
  assert.match(configText, /"questionCount":10/);
  assert.match(configText, /"difficulty":"tough"/);
  assert.match(configText, /Explaining tradeoffs/);
  assert.equal(await ui.getByRole("button", { name: "Confirm setup", exact: true }).isDisabled(), true);
  const settings = JSON.parse(configText.match(/setup: (.*)\. Keep the role/)[1]);
  await acknowledge({ phase: "ready", confirmed: true, settings });
  await ui.getByRole("button", { name: "Prepare for voice interview" }).click();
  await lastMessage();
  assert.equal(await page.evaluate(() => window.testHost.messages.length), 2);
  await acknowledge({});
  await ui.getByRole("button", { name: "Prepare for voice interview" }).waitFor({ state: "visible" });
  assert.equal(await ui.getByRole("heading", { name: "Your interview is ready" }).count(), 1);
  assert.ok((await page.evaluate(() => window.testHost.messages.at(-1))).includes("Wait for my start cue"));
  await page.screenshot({ path: "temp/ui/ready.png" });
  await ui.getByRole("button", { name: "Start in text", exact: true }).click();
  await acknowledge({ phase: "interview", status: "running", questionNumber: 1, pendingQuestionId: "q1", settings: { ...settings, mode: "text" } });
  await ui.getByRole("button", { name: "Pause", exact: true }).click();
  await acknowledge({ status: "paused" });
  await ui.getByRole("button", { name: "Resume", exact: true }).waitFor();
  await page.screenshot({ path: "temp/ui/session.png" });
  await ui.getByRole("button", { name: "Retry answer", exact: true }).click();
  assert.match(await lastMessage(), /end-only retry does not request coaching/);
  await acknowledge({});
  await publish({ revision: 9, phase: "debrief", status: "ended", pendingQuestionId: null, practice: { target: "Explaining tradeoffs", questionId: "q1" } });
  await ui.getByRole("button", { name: "Start focused practice" }).waitFor();
  await page.screenshot({ path: "temp/ui/practice.png" });
  await ui.getByRole("button", { name: "Start focused practice" }).click();
  await acknowledge({ phase: "practice", status: "running", pendingQuestionId: "drill1" });
  await page.evaluate(() => { window.testHost.reject = true; });
  await ui.getByRole("button", { name: "Pause", exact: true }).click();
  await ui.getByRole("status").filter({ hasText: "Delivery could not be confirmed" }).waitFor();
  assert.equal(await ui.getByRole("button", { name: "Pause", exact: true }).isDisabled(), true);
  await ui.getByRole("button", { name: "Refresh workspace" }).click();
  await page.waitForFunction(() => window.testHost.messages.at(-1)?.includes('"type":"refresh"'));
  assert.match(await page.evaluate(() => window.testHost.messages.at(-1)), /without changing progress or replaying any action/);
  await page.evaluate(() => { window.testHost.reject = false; });
  await acknowledge({});
  // Render the same card at responsive sizes and both themes; no horizontal overflow.
  for (const width of [375, 768, 1440]) for (const theme of ["light", "dark"]) {
    await page.setViewportSize({ width, height: 1024 });
    await page.evaluate(theme => window.testHost.theme(theme), theme);
    await ui.locator(`html[data-theme="${theme}"]`).waitFor();
    const overflow = await ui.locator("body").evaluate(el => el.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `${width}px ${theme} overflows`);
    await page.screenshot({ path: `temp/ui/practice-${width}-${theme}.png` });
  }
  // Restoration: cached state is visible but controls stay disabled without fresh output.
  await page.evaluate(() => { window.testHost.hold = true; window.testHost.reload(); });
  await ui.getByRole("status").filter({ hasText: "Restored view" }).waitFor();
  assert.equal(await ui.getByRole("button", { name: "Pause", exact: true }).isDisabled(), true);
  await publish({ revision: 12 });
  await ui.getByRole("button", { name: "Pause", exact: true }).waitFor();
  assert.equal(await ui.getByRole("button", { name: "Pause", exact: true }).isEnabled(), true);
  await page.goto(`http://127.0.0.1:${port}/?mode=no-message`);
  await ui.getByRole("button", { name: "Help me add my job description" }).waitFor();
  assert.equal(await ui.getByRole("button", { name: "Help me add my job description" }).isEnabled(), true);
  await ui.getByRole("button", { name: "Help me add my job description" }).click();
  await ui.getByRole("region", { name: "Add job description" }).waitFor();
  assert.equal(await page.evaluate(() => window.testHost.messages.length), 0);
  await page.goto(`http://127.0.0.1:${port}/?mode=compat`);
  await ui.getByRole("button", { name: "Help me add my job description" }).waitFor();
  await publish({ phase: "ready", revision: 2, sources: { job: "read", background: "read" }, confirmed: true });
  await ui.getByRole("button", { name: "Start in text", exact: true }).click();
  await page.waitForFunction(() => window.testHost.messages.length === 1);
  assert.match(await page.evaluate(() => window.testHost.messages[0]), /Begin my interview in text now/);
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log("Browser bridge, five views, settings, acknowledgments, voice handoff, controls, uncertain delivery, restoration, capability fallback, CSP, and responsive themes passed. Screenshots: temp/ui/.");
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
