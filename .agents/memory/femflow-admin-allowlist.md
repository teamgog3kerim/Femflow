---
name: FemFlow admin allowlist
description: How admin access is granted/revoked in FemFlow and why it is allowlist-based, not manual SQL.
---

# FemFlow admin access

Admin is controlled by a **username allowlist**, not one-off SQL promotion.

- Env `ADMIN_USERNAMES` (comma-separated, case-insensitive, `@` stripped); default hardcoded so prod works without setting a secret.
- On every Telegram login (`POST /users/telegram-auth`), the user's `username` is refreshed and `isAdmin` is reconciled to the allowlist (grant if listed, revoke if not).
- `syncAdminsToAllowlist()` runs at server startup (called from `index.ts` listen callback) to enforce the invariant globally — revokes any admin not on the list (incl. null-username rows) and grants any existing user that is. Idempotent; safe every boot.

**Why:** Reconcile-on-login alone is only eventual/per-user — a leftover admin who never logs in stays flagged. The startup sync makes "only allowlisted usernames are admin" true globally, including in production on next deploy.

**How to apply:**
- To change the admin: set `ADMIN_USERNAMES` (username without `@`) and republish. Target user becomes admin automatically on their next login; everyone else is demoted at startup.
- Dev DB and PROD DB are separate. Agent tools can only READ prod (read-only replica) — cannot write prod. The startup sync is the mechanism that cleans prod admin rows on the next deploy.
- Known weakness: Telegram usernames are mutable/reclaimable, so username-based admin is a soft identity binding. If stronger guarantees are needed, switch to a Telegram-**ID** allowlist (`ADMIN_TELEGRAM_IDS`) and use username only as display metadata — but that requires the target's numeric Telegram id (only known after they log in once).
