---
name: Updated secrets need platform restart_workflow to propagate
description: Why a newly added/changed Replit secret isn't seen by scripts, and the only reliable way to run a script with the fresh value.
---

When a secret is added or changed mid-session (e.g. via `requestEnvVar`), the new value does NOT reach:
- the agent's `bash` shell (env snapshot is fixed at session start)
- the `code_execution` JS sandbox
- workflows spawned/started via the JS `configureWorkflow({autoStart})` callback — they inherit the stale agent env snapshot

Only the **platform top-level `restart_workflow` tool** re-injects secrets fresh from the store into the relaunched workflow process.

**How to apply:** To run a one-off script that depends on a just-updated secret, register it as a workflow, then start/refresh it with the top-level `restart_workflow` tool (not JS `configureWorkflow` autoStart, not bash). Verify, then `removeWorkflow`. Also restart any long-running service (e.g. api-server) via `restart_workflow` so it picks up the new value.

**Why:** Diagnosing a Telegram bot misconfiguration, the saved `TELEGRAM_BOT_TOKEN` kept resolving (via getMe) to the old bot in bash and in JS-spawned workflows even after the secret was updated; only a `restart_workflow`-launched process saw the new token.

**Verify bot identity without leaking the token:** `curl -s ".../bot$TOKEN/getMe" | grep -o '"username":"[^"]*"'` — print only the username, never the token value.
