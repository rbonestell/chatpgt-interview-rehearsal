# MCP workspace development and deployment

## Architecture

The existing skill owns interviewing, source extraction, progress, and evidence-based coaching. `show_interview_workspace` validates and echoes a versioned, minimal snapshot and associates it with `ui://interview-rehearsal/workspace-v1.html`. The tool is model-visible only. It is read-only because it renders supplied metadata without persisting state or running a job. Button effects happen in the conversation, not in this tool.

`server/workspace.ts` registers the tool/resource with the official SDK helpers. `server/http.ts` uses a fresh stateless Streamable HTTP transport per request and JSON responses. There is no SSE session, database, account, sampling/model call, audio service, or privileged server action. The same handler runs behind a loopback Node adapter and a Cloudflare Worker.

`ui/` contains React views, a controller with validated snapshots/pending actions, and the MCP Apps bridge. `shared/workspace.ts` defines runtime schemas and the user-action contract. The UI uses the SDK's initialization, tool-result notifications, `sendMessage` (`ui/message`), and optional `updateModelContext`. Host theme variables and safe-area insets are applied. `window.openai` is feature-detected only for optional widget persistence and compatibility message delivery when standard messaging is unavailable. A failed standard send never falls through to a second send.

Each action includes an opaque workflow ID, base revision, and action ID. Controls remain pending until the conversation publishes a higher revision acknowledging that ID. The model rejects stale and duplicate actions using its conversation state. This is not exactly-once delivery or authentication. No server database can independently verify a model's historical assertions. Previously rendered widgets can remain visible; the conversation must reject old revisions. Restored host widget state is treated as unconfirmed until fresh tool output arrives. There is no localStorage or cross-chat cache of candidate data.

Inline cards are used for bounded workflow decisions, with the main conversation remaining the ongoing interview workspace. No sidebar, fullscreen app, custom uploader, deep links, voice activation hook, or second interviewer is introduced. All five components remain usable through text when UI is unavailable.

## Dependencies and protocol compatibility

Node.js 24+ is required. The lockfile pins the full build. MCP SDK `1.32.1` and MCP Apps `1.7.5` use the same SDK 1.x types and official quickstart conventions. MCP Apps 2.x has moved to the modular MCP SDK 2.x packages; do not upgrade just one side. The UI SDK negotiates its supported MCP Apps protocol version (`2026-01-26`). The HTTP implementation is stateless Streamable HTTP, with protocol-version negotiation handled by the SDK. Zod JIT is disabled for Worker/iframe CSP compatibility. Re-check official examples and host compatibility when upgrading.

References: [OpenAI UI guidance](https://developers.openai.com/plugins/build/chatgpt-ui), [server/UI quickstart](https://developers.openai.com/plugins/build/app-quickstart), [MCP Apps specification](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx), [MCP Extensions guidance](https://github.com/openai/mcp-extensions/blob/main/AGENTS.md), [packaging](https://developers.openai.com/plugins/build/plugins), [connection testing](https://developers.openai.com/plugins/deploy/connect-chatgpt).

## Local development

```sh
npm ci
npm run check
npm start
```

The local endpoint is `http://127.0.0.1:8787/mcp`; `/health` returns `ok`. Host-header validation protects the loopback listener. For browser-based MCP Inspector, explicitly add its exact origin using `ALLOWED_ORIGINS`; no browser origins are allowed by default in the Node adapter. Do not expose that adapter as a production origin without reviewing its bind address, proxy, and host/origin validation.

```sh
npx @modelcontextprotocol/inspector
```

Connect using Streamable HTTP, discover `show_interview_workspace`, read the UI resource, and exercise the schema with fictional data. Hosted ChatGPT development connections need a supported reachable HTTPS endpoint or Secure MCP Tunnel; loopback is for local tools. Refresh connection metadata after tool/resource changes and start a new conversation. No private candidate data belongs in Inspector, screenshots, fixtures, or issue reports.

The live Worker runtime can also run locally:

```sh
npm run build
npx wrangler dev
```

`npm run test:browser` builds and exercises the actual bundled iframe with the official SDK host bridge. Install the browser with `npx playwright install chromium` first. `npm run test:worker` launches Wrangler's local workerd runtime and checks initialization, tool discovery/execution, HTML resources, and origin protection. Generated screenshots/reports live under ignored `temp/`; keep host test results private. `npm run check` covers schemas, pending/acknowledgment behavior, stateless HTTP, MCP discovery/resource reads, and markup; it does not establish ChatGPT or voice behavior.

## Cloudflare and GitHub Actions

The Worker name is `chatgpt-interview-rehearsal-mcp` and the configured custom domain is `chatgpt-interview-rehearsal-mcp.rbonestell.com`. Confirm that the existing Worker uses this name before deploying; adjust `wrangler.jsonc` if needed rather than accidentally creating another Worker. A Cloudflare-managed custom-domain route serves HTTPS `/mcp`. No Durable Object, KV, R2, D1, or OpenAI API key is needed. Cloudflare remains the infrastructure provider and can process network metadata.

1. Deployment reads repository Actions secrets `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`; no GitHub environment is required. Use a scoped token with the Worker deployment and custom-domain permissions required for this account/zone. Never put tokens in `wrangler.jsonc`, MCP configuration, or commits.
2. Review provider access/security logging and retention. Worker observability is disabled in the supplied configuration. Do not enable request-body or tool-argument logging. Add appropriate Cloudflare edge rate limits before broad public access; application request bodies are capped at 32 KiB. Input schemas limit labels and reject extra fields but cannot guarantee that valid strings contain no personal data.
3. The existing **Bundle release** workflow runs on published GitHub releases. It synchronizes release metadata, installs dependencies, runs checks, deploys with `wrangler deploy`, verifies/configures `/mcp`, bundles the connected plugin, and uploads the ZIP before updating main's versions. Deployment uses repository Actions secrets directly. A separate **Deploy MCP to Cloudflare** workflow supports manual server-only updates from a reviewed branch. Both workflows share a concurrency group to avoid overlapping deployments. No secrets or production account changes are made by local builds or dry runs.
4. Verify `/health`, tool discovery, tool execution, resource content/CSP, and the intended ChatGPT host. Check that unrelated paths return 404 and untrusted browser origins return 403. Allowed browser origins are explicit in `wrangler.jsonc`; extend the list only for verified host/Inspector origins. Server-to-server requests without Origin remain supported. Set `UI_DOMAIN` to the dedicated origin used for this plugin's UI.
5. Configure the connection after the endpoint actually serves this MCP implementation:

   ```sh
   npm run configure:mcp -- https://chatgpt-interview-rehearsal-mcp.rbonestell.com/mcp
   npm run bundle
   ```

   Root `mcp.json` is tracked so repository marketplace installs receive the same connection as release ZIPs. The command verifies health, MCP initialization, deployed/package version agreement, tool discovery, and the UI resource before synchronizing that file. Endpoint configuration alone is not proof of live MCP or ChatGPT behavior. The ZIP includes this maintainer guide but excludes executable server source, node_modules, tests, build artifacts, and deployment configuration. Portable MCP configuration is distinct from registered App bindings; no backend IDs are invented.
6. GitHub releases always deploy and verify the Worker before packaging. The default endpoint is `https://chatgpt-interview-rehearsal-mcp.rbonestell.com/mcp`; repository variable `MCP_ENDPOINT` can override it for that release ZIP. If changing the canonical endpoint, also update tracked `mcp.json`, `wrangler.jsonc`, and these instructions so repository installs agree. A deployment or verification failure stops archive creation/upload. The locally invoked bundler can intentionally produce a conversational fallback ZIP if `mcp.json` is omitted. Public release packaging requires the working connection.

References: [Cloudflare MCP transport](https://developers.cloudflare.com/agents/model-context-protocol/protocol/transport/), [GitHub Actions deployments](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).

## Host acceptance and release gates

Local tests and the browser bridge harness cannot establish that ChatGPT will deliver messages during an active response, retain a widget across turns, or support same-conversation voice on every client. Before public release, follow the workspace scenarios in the skill's maintainer specification using fictional data. In particular verify start acknowledgment and refreshed cards in ChatGPT before treating the integration as host-ready. If host synchronization differs from the local harness, resolve it before rollout.

Verify light/dark themes, keyboard focus, screen reader labels/status, 375/768/1440px layouts, all five views, customized settings, limited/inaccessible inputs, no-UI fallback, manual voice handoff, unavailable voice, network failure and uncertain delivery, duplicate/stale cards, restoration, pause/resume/repeat/retry/skip, end-only assistance rules, early endings, and post-debrief drills. Record host versions and actual results privately; identify untested surfaces in the PR. Capture UI screenshots under ignored `temp/` for review. No deployment, installation, public submission, or native voice success is implied by code completion.
