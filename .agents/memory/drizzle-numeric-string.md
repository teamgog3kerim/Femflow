---
name: Drizzle numeric columns are strings
description: Why numeric DB fields must be coerced to strings before insert/update in this repo
---

Drizzle ORM maps Postgres `numeric()` columns to TypeScript `string`, not `number`.

**Why:** numeric/decimal can exceed JS number precision, so drizzle keeps them as strings. But the OpenAPI/Zod request bodies model these fields as `number` (e.g. health-log `sleepHours`, `waterIntakeLiters`, `weightKg`). Passing the number straight into `.values()` / `.set()` fails typecheck (`number not assignable to string | SQL | ...`).

**How to apply:** before writing, coerce numeric fields with `String()` (a small `coerceNumericFields` helper) and cast the object to `typeof table.$inferInsert` (insert) or `Partial<typeof table.$inferInsert>` (update). Applies anywhere a Zod `number` field is written to a drizzle `numeric` column.

**Read side too (response parsing):** the same mismatch breaks `Response.parse(serialize(row))` — `serialize()` keeps numeric columns as strings, but the OpenAPI response schema expects `number`, so `.parse()` throws a ZodError → 500. Coerce back with `Number()` before parsing, e.g. `{ ...serialize(row), priceEtb: Number(row.priceEtb) }` (map per-item for arrays). This bit the subscriptions `priceEtb` field (numeric column) on both GET /subscriptions/me and POST /subscriptions, plus the admin list/update responses.
