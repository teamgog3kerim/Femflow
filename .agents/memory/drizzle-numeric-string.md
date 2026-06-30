---
name: Drizzle numeric columns are strings
description: Why numeric DB fields must be coerced to strings before insert/update in this repo
---

Drizzle ORM maps Postgres `numeric()` columns to TypeScript `string`, not `number`.

**Why:** numeric/decimal can exceed JS number precision, so drizzle keeps them as strings. But the OpenAPI/Zod request bodies model these fields as `number` (e.g. health-log `sleepHours`, `waterIntakeLiters`, `weightKg`). Passing the number straight into `.values()` / `.set()` fails typecheck (`number not assignable to string | SQL | ...`).

**How to apply:** before writing, coerce numeric fields with `String()` (a small `coerceNumericFields` helper) and cast the object to `typeof table.$inferInsert` (insert) or `Partial<typeof table.$inferInsert>` (update). Applies anywhere a Zod `number` field is written to a drizzle `numeric` column.
