# solid-octo-giggle

## Codex MCP setup

To mirror the Claude Playwright MCP setup for Codex, register the same server in Codex CLI:

```bash
/opt/codex/bin/codex mcp add playwright -- \
  npx @playwright/mcp@latest \
  --headless \
  --executable-path /opt/pw-browsers/chromium-1194/chrome-linux/chrome
```

Then verify registration:

```bash
/opt/codex/bin/codex mcp list
```
