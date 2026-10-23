# Agent Instructions

## Project Structure & Module Organization

This repository packages Interview Rehearsal, an interview coaching skill with an optional stateless MCP Apps workspace hosted on Cloudflare Workers. Local PDF generation remains outside this branch.

- `skills/mock-interview/SKILL.md`: skill metadata, operating rules, and five-phase interview workflow.
- `skills/mock-interview/references/`: interaction guidance, interview design, feedback rubric, practice loops, and maintainer acceptance scenarios.
- `plugin.json`: root plugin manifest.
- `.codex-plugin/plugin.json`: Codex manifest, skill discovery path, and icon references.
- `images/icon.png`: plugin artwork.
- `README.md`: installation instructions and user-facing limitations.
- `server/`: MCP registration, stateless HTTP handler, Node adapter, Worker entry point, and deployment guide.
- `shared/`: runtime snapshot/action schemas and package version.
- `ui/`: React views, MCP Apps bridge, pending-action controller, and styles.
- `mcp.json`: portable remote MCP connection for marketplace installs and release ZIPs.
- `wrangler.jsonc`: Worker configuration for the supplied custom domain.
- `tests/` and `scripts/`: fictional fixtures, protocol/state checks, browser/runtime checks, and packaging scripts.

## Build, Test, and Development Commands

Use Node.js 24+ and `npm ci` for the MCP workspace. Edit Markdown and JSON directly. No OpenAI API key or database is needed.

- `npm run check`: typecheck, schema/state/protocol tests, and build.
- `npm run test:browser`: bundled iframe checks with the official host bridge; requires Playwright Chromium.
- `npm run test:worker`: MCP smoke test in Wrangler's local workerd runtime.
- `npm start`: serve the built MCP endpoint on loopback.
- `npx wrangler deploy --dry-run --outdir temp/worker`: validate deployment bundle without deploying.
- `node scripts/bundle-plugin.mjs`: build and inspect the install ZIP.

- `python3 -m json.tool plugin.json > /dev/null`: validate root manifest JSON.
- `python3 -m json.tool .codex-plugin/plugin.json > /dev/null`: validate Codex manifest JSON.
- `python3 -m json.tool mcp.json > /dev/null`: validate portable MCP JSON.
- `git diff --check`: check tracked changes for whitespace errors.
- `git diff -- skills/ README.md plugin.json .codex-plugin/plugin.json`: review content and metadata changes.

For behavioral validation, load the plugin into a supported host and follow the acceptance scenarios below.

## Coding Style & Naming Conventions

Use concise Markdown headings, direct instructions, and relative links to reference files. Preserve the YAML front matter in `SKILL.md`. Use lowercase, hyphen-separated reference filenames, such as `practice-loops.md`.

Keep TypeScript strict, dependency versions pinned, and shared schema validation in `shared/`. Use the MCP Apps SDK bridge before optional host extensions. The conversation owns acknowledged progress; rendering a card never executes an interview action. Keep server handlers stateless and do not log request bodies or candidate data.

Format JSON with two-space indentation and double-quoted keys and strings. No formatter or linter is configured. Keep shared manifest metadata synchronized. The release version lives in both manifests; the README intentionally has no version heading.

## Testing Guidelines

Use `skills/mock-interview/references/review-scenarios.md` as the acceptance specification. No automated coverage threshold exists. Use fictional candidate data for targeted checks of changed behavior. Existing user testing may satisfy relevant scenarios; repeat checks when changes or unresolved issues warrant it. Keep test results private rather than publishing them in this repository. Explicitly report untested surfaces when describing validation. JSON validation does not establish live interview or voice behavior.

## Commit & Pull Request Guidelines

Use short, imperative commit subjects, such as `Clarify interview pause behavior`.

Keep changes focused. PR descriptions should explain the changed behavior, identify affected files, link relevant issues, and report validation and untested host features. Include screenshots for artwork or visible interface changes.

## Privacy & Host Capabilities

Keep real resumes, personal identifiers, and credentials out of fixtures and commits. Preserve readable-text fallbacks and accurate host limitations; never promise automatic voice activation or unsupported capabilities.
