---
name: FemFlow auth pattern
description: How bearer token auth works end-to-end in FemFlow (frontend + backend).
---

FemFlow uses custom HMAC-signed bearer tokens (not Clerk, not Replit Auth).

**Backend (`artifacts/api-server/src/lib/auth.ts`):**
- `sign(userId)` — creates a base64url JSON payload + HMAC-SHA256 signature using `SESSION_SECRET`
- `verify(token)` — validates signature, returns `userId | null`
- Routes call `getUserId(req)` which reads `Authorization: Bearer <token>` header

**Frontend:**
- `main.tsx` calls `setBaseUrl('/api')` and `setAuthTokenGetter(() => localStorage.getItem('femflow_token'))` from `@workspace/api-client-react` — this wires every generated hook to prepend `/api` and attach the bearer token
- On login, `use-auth.ts` calls `POST /users/auth` with the user's Telegram ID, saves `result.token` to `localStorage['femflow_token']`, then refetches `/users/me`
- Logout clears both `femflow_telegram_id` and `femflow_token` from localStorage

**First admin user:** Must be set manually via SQL: `UPDATE users SET is_admin = true WHERE telegram_id = '...'`
