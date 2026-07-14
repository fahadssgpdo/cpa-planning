---
name: Anthropic AI integration setup
description: How the Anthropic AI integration is wired into this project
---

## Setup (already done)

- Env vars provisioned: `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_API_KEY`
- Template lib copied to `lib/integrations-anthropic-ai/`
- Root `tsconfig.json` references `./lib/integrations-anthropic-ai`
- `artifacts/api-server/tsconfig.json` references `../../lib/integrations-anthropic-ai`
- `artifacts/api-server/package.json` depends on `@workspace/integrations-anthropic-ai`

**Why:** Needed for dashboard AI copilot insights. Uses `claude-sonnet-4-6`.

**How to apply:** Import `anthropic` from `@workspace/integrations-anthropic-ai` in any api-server route. Do NOT ask user for API keys.

## Note
- Conversation/message DB tables (from template) were NOT copied — not needed for one-shot insight calls.
- If full chat scaffolding needed later, copy `lib/db/src/schema/conversations.ts` + `messages.ts` and export from db barrel.
