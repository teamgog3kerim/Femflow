---
name: Object storage serving under bearer-token auth
description: How to gate sensitive object-storage file serving in an app that uses HMAC bearer tokens in localStorage (no cookies)
---

When serving sensitive files (e.g. payment receipts) from `/storage/objects/*`, do NOT leave the route public — gate it with `getUserId(req)` (HMAC bearer) like the rest of the API.

**Why:** Object paths are unguessable UUIDs but the files are sensitive payment proofs; a public endpoint means anyone with the path can fetch them. The architect fails the build on this.

**The `<img>` problem:** This app stores the token in `localStorage['femflow_token']` and sends it via the `Authorization` header (no cookies). A plain `<img src="/api/storage/objects/...">` cannot send headers, so once the route is gated, direct `<img src>` returns 401.

**How to apply:**
- Owner viewing their just-uploaded file: render a LOCAL preview with `URL.createObjectURL(file)` — no server round-trip needed (they have the file in hand). Revoke the URL on change/submit.
- Admin (or anyone) viewing a stored file: `fetch` the URL with `Authorization: Bearer <token>` from localStorage, get a `blob()`, then `URL.createObjectURL(blob)` for the `<img src>`. Revoke on unmount.
- The `useUpload` hook uploads via PUT directly to the GCS presigned URL (not our server), so gating our serve route does not affect uploads. `/storage/uploads/request-url` only mints a presigned URL and persists nothing — left as the template default (open).
- Also validate any client-supplied object path server-side (e.g. `receiptImageUrl.startsWith("/objects/")`) before storing it.
