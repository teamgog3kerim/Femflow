---
name: Vendored openai-ai-react lib breaks typecheck:libs
description: The Replit-vendored OpenAI react integration lib fails tsc --build until react devDeps are added
---

`lib/integrations-openai-ai-react` (Replit-vendored AI integration) is referenced by the root tsconfig and built by `pnpm run typecheck:libs` (`tsc --build`), but no artifact imports it.

**Why:** it declares `react` only as a `peerDependency`, so when `tsc --build` typechecks the lib in isolation it cannot resolve `react` ("Cannot find module 'react'") and fails the whole aggregate typecheck — even though per-artifact typechecks (femflow, api-server) and runtime are unaffected.

**How to apply:** add `react` + `@types/react` (catalog) as **devDependencies** to that lib so it typechecks standalone. The sibling `integrations-openai-ai-server` lib needs `response.data?.[0]` optional chaining (its `images` response `data` is possibly undefined) for the same `tsc --build` to pass.
