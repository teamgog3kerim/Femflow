---
name: FemFlow esbuild externals
description: Why openai/p-limit/p-retry must be both installed in api-server AND listed as externals in build.mjs.
---

`lib/integrations-openai-ai-server` declares `openai`, `p-limit`, and `p-retry` as its dependencies. When esbuild bundles `artifacts/api-server` (which imports from this lib), it resolves imports relative to the api-server package context — not the lib's own node_modules.

**Why:** esbuild fails with "Could not resolve" unless these packages are available to the bundler. Marking them `external` tells esbuild to leave the import as-is; then at runtime Node.js resolves them from api-server's own node_modules.

**How to apply:**
1. `pnpm add openai p-limit p-retry` inside `artifacts/api-server`
2. Add them to the `external` array in `artifacts/api-server/build.mjs`

Both steps are required — install for runtime resolution, external for build-time skip.
