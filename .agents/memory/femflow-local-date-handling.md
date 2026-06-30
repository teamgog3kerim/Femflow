---
name: FemFlow local date handling
description: Calendar/period day values must use local-date helpers, not UTC toISOString
---

In FemFlow's cycle calendar / period logging, day values are calendar dates (YYYY-MM-DD), not instants.

**Rule:** Never derive or render a user-facing day with `new Date().toISOString().split("T")[0]` or `new Date("YYYY-MM-DD")`. Both interpret in UTC and shift by one day in negative-offset timezones (e.g. the Americas).

**How to apply:**
- "Today" / values sent to the API: build from local parts — `${y}-${MM}-${DD}` using `getFullYear/getMonth/getDate`.
- Formatting a stored date string for display: split off the time, then `new Date(y, m-1, d)` (local) before `Intl.DateTimeFormat`.

**Why:** A cycle tracker that records the wrong day (off-by-one) is materially incorrect. Caught in code review of the calendar feature.
