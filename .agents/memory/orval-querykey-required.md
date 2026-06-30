---
name: Orval query hooks require queryKey in options override
description: TanStack Query v5 makes queryKey mandatory in the query options object of generated hooks
---

When passing a `query` options override to an Orval-generated `useGetX` hook in this repo (e.g. `useGetMe({ query: { enabled, retry } })`), TypeScript errors that `queryKey` is missing.

**Why:** the generated option type is `UseQueryOptions<...>` (TanStack v5), where `queryKey` is required — it is not made `Partial`. At runtime the hook defaults the key, but the type still demands it.

**How to apply:** import the generated key helper and pass it: `useGetMe({ query: { queryKey: getGetMeQueryKey(), enabled, retry } })`. Each hook has a matching `getXQueryKey()` exported from `@workspace/api-client-react`.
