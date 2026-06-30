---
name: FemFlow /api prefix single source of truth
description: Where the /api base path must (and must not) be applied across the Orval codegen + custom-fetch client, to avoid doubled /api/api 404s.
---

The `/api` base path for FemFlow is applied in exactly ONE place: at runtime via `setBaseUrl("/api")` in `artifacts/femflow/src/main.tsx` (custom-fetch's `applyBaseUrl` prepends it to relative paths).

Generated client paths MUST stay relative (e.g. `/users/telegram-auth`, not `/api/users/...`).

**Do NOT** add either of these — each one bakes `/api` into generated paths and the runtime prepend then doubles it into `/api/api/...` → HTTP 404 on every request:
- `output.baseUrl: "/api"` in `lib/api-spec/orval.config.ts`
- a `servers: [{ url: /api }]` entry in `lib/api-spec/openapi.yaml`

**Why:** A real incident — Telegram Mini App login hit `POST /api/api/users/telegram-auth` (404). Root cause was Orval `baseUrl`/spec `servers` adding `/api` on top of the runtime `setBaseUrl("/api")`.

**How to apply / verify:** After any codegen change, `rg "return \`/" lib/api-client-react/src/generated/api.ts` should show relative paths with no `/api` prefix. Sanity check via proxy: `POST localhost:80/api/users/telegram-auth` returns 400 (route reached), `…/api/api/…` returns 404.
