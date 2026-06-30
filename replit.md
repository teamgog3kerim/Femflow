# FemFlow

AI-powered women's menstrual health Telegram Mini App — cycle tracking, daily health logging, AI companion chat, analytics, education, and a subscription system.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/femflow run dev` — run the React frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — HMAC signing key for bearer tokens

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, Wouter routing, TanStack Query, Tailwind, shadcn/ui, Framer Motion
- API: Express 5 (ESM bundle via esbuild)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- AI: OpenAI via Replit AI integration (model: `gpt-4o-mini`)
- Build: esbuild (CJS bundle), externals include `openai`, `p-limit`, `p-retry`

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI source of truth (~40+ endpoints)
- `lib/db/src/schema/` — Drizzle ORM schema files (users, cycles, health-logs, ai-messages, articles, subscriptions, notifications, announcements)
- `lib/api-zod/src/` — Generated Zod schemas (from codegen)
- `lib/api-client-react/src/` — Generated React Query hooks (from codegen)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/` — Auth (HMAC JWT), serialize helper, logger
- `artifacts/femflow/src/pages/` — All app pages (home, cycle, log, chat, analytics, education, subscription, admin, settings, onboarding)
- `artifacts/femflow/src/hooks/use-auth.ts` — Auth hook (stores token in `localStorage`)

## Architecture decisions

- **Contract-first**: OpenAPI spec → Orval codegen → Zod schemas + React Query hooks. Never write fetch calls by hand.
- **Auth**: Custom HMAC bearer tokens (signed with `SESSION_SECRET`). No session cookies. Token stored in `localStorage['femflow_token']`. `setAuthTokenGetter` configured in `main.tsx`.
- **Date serialization**: Drizzle returns `Date` objects; Zod (from OpenAPI) expects `string`. All routes call `serialize()` (`JSON.parse(JSON.stringify(…))`) before Zod parsing.
- **AI model**: `gpt-4o-mini` via Replit AI Integrations proxy. Context includes last 3 cycles + last 3 health logs.
- **Subscription flow**: Users pay 990 ETB/month via CBE bank (account `1000123456789`), upload a transfer receipt, admin reviews and approves/rejects manually.

## Product

- **Cycle tracking**: Log period start/end, flow intensity, notes. Auto-calculates cycle day, phase, next period date, fertile window, ovulation date.
- **Daily health logs**: Mood, pain level, energy, sleep, water intake, exercise, symptoms, weight, notes.
- **AI companion**: Chat with FemFlow AI (powered by OpenAI), which knows the user's recent cycle + health context.
- **Analytics**: Wellness score, symptom trends, mood trends, cycle calendar.
- **Education**: Articles in English and Arabic (cycle, wellness, nutrition, health categories).
- **Subscription**: Submit bank transfer receipt for 990 ETB/month premium plan; admin approves.
- **Admin dashboard**: User list, subscription management, analytics overview, article CRUD, announcements.
- **Bilingual**: English and Arabic with RTL layout support.

## User preferences

- Bilingual (English/Arabic) is a core requirement.

## Gotchas

- `openai`, `p-limit`, `p-retry` must be in api-server's `dependencies` AND marked as `external` in `build.mjs` (they come from `lib/integrations-openai-ai-server` and esbuild can't bundle them cross-package).
- Admin access: first admin must be set via SQL (`UPDATE users SET is_admin = true WHERE telegram_id = '...'`).
- `symptoms` column in `health_logs` is a Postgres `text[]` array — handle `Array.isArray` checks when reading.
- Date fields from Drizzle are `Date` objects; always call `serialize()` before Zod parsing in route handlers.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
