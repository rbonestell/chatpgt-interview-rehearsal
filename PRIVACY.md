# Interview Rehearsal privacy policy

Last updated: October 23, 2026

Interview Rehearsal is an interview practice plugin published by Bobby Bonestell. Its coaching instructions run within ChatGPT. An optional connected MCP workspace provides interactive controls. Packages without an MCP connection use the conversational workflow alone. The workspace service is designed for Cloudflare Workers at `chatgpt-interview-rehearsal-mcp.rbonestell.com`; a connection must be deployed and configured before it is usable. This policy describes both configurations.

## Interview data

The plugin uses information you choose to provide in your ChatGPT conversation to tailor questions and feedback. Source files, resume text, answer evidence, and voice recordings are not required by the workspace service. The skill is instructed to keep them in the conversation and not include them in workspace tool calls. The workspace does not request microphone access or operate an audio service.

If the workspace is connected, ChatGPT sends the service a compact snapshot: an opaque workflow label, revision, phase, short role title, source-readiness statuses, interview settings (including optional focus and voice/text preference), question progress and opaque question labels, an optional short practice target, and action-acknowledgment IDs. Do not put personal or confidential details in focus or other short labels. Model-generated tool arguments can contain unintended information; minimize what you share. The public rendering endpoint does not authenticate users or expose stored private resources.

The service validates the snapshot and returns it with the interface. It has no interview database, accounts, analytics code, or application request-body logging. Processing is transient within each request; the application does not retain snapshots after responding or sell their contents. Button requests go through the host's conversation bridge. Where available, optional host-managed widget state can preserve a view and pending request; the service does not provide durable or cross-chat memory. Restored views need fresh conversation state before controls become active.

Hosting necessarily sends network metadata, such as IP address, request time, and endpoint path, to Cloudflare. Worker observability is disabled in this repository's deployment configuration. Cloudflare can process operational/security data under its own [privacy policy](https://www.cloudflare.com/privacypolicy/). Infrastructure settings and retention must be reviewed before public deployment; disabling application logs is not a promise that the provider processes no network metadata. Self-hosting operators control their own infrastructure policies. For questions about publisher-operated service data, contact support without including candidate details.

ChatGPT's processing, storage, sharing, retention, model-training settings, and deletion controls are governed by [OpenAI's Privacy Policy](https://openai.com/policies/privacy-policy/) and the terms and settings applicable to your account or workspace. OpenAI's policy links to regional versions where applicable; business offerings may be governed by customer agreements. This plugin does not change those practices or controls. Use ChatGPT's account and workspace controls for requests concerning data held by OpenAI; the publisher cannot access or delete it.

When you request research or provide links, ChatGPT may use its browsing tools to contact websites. Those services have their own data practices. The plugin instructs ChatGPT not to include resume text or personal identifiers in company-research queries. Share only information you are authorized to disclose and redact unnecessary personal or confidential details.

## Support

If you voluntarily post a [GitHub issue](https://github.com/rbonestell/chatpgt-interview-rehearsal/issues), the publisher and other people with access to the repository can see your GitHub identity and the content you post. That information is used to address your report and is hosted by GitHub under its policies and controls. Do not post resumes, private conversations, credentials, or other sensitive information. Public issues can remain visible after resolution; use GitHub's editing and deletion controls for content you submit.

For questions about this policy, open an issue without including sensitive personal information.
