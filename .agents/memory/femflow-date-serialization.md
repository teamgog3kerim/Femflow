---
name: FemFlow date serialization
description: Why and how DB dates are serialized before Zod parsing in route handlers.
---

Drizzle ORM returns JavaScript `Date` objects from Postgres timestamp columns. The Zod schemas generated from the OpenAPI spec (via Orval) expect those fields as ISO `string` values, because OpenAPI represents dates as strings.

**Why:** Passing a raw Drizzle result directly to `ZodSchema.parse()` causes "expected string, received date" errors for every `createdAt` / `updatedAt` / date field.

**How to apply:** Call `serialize(data)` from `artifacts/api-server/src/lib/serialize.ts` before every Zod parse in route handlers:

```ts
import { serialize } from "../lib/serialize.js";
res.json(SomeResponse.parse(serialize(dbResult)));
```

`serialize` is `JSON.parse(JSON.stringify(data))` — converts all `Date` instances to ISO strings cheaply.
