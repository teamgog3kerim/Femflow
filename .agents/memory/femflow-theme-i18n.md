---
name: FemFlow theming & language architecture
description: Durable decisions for light/dark theming and EN/AR (RTL) language propagation in the FemFlow frontend.
---

- Theme (light/dark): applied at bootstrap (before first render), not only inside the app shell.
  **Why:** onboarding is pre-auth and does not mount the shell, so applying theme only in the shell causes an unstyled flash / wrong theme on the login screen.

- Language + RTL: kept in a single shared React context provider near the app root; `useAuth` reads/writes language through it rather than owning per-instance state.
  **Why:** a header-level language switcher must update every mounted page and `document.dir` instantly. Per-hook-instance language state only updated on navigation/remount — a real regression once the switcher moved into the always-visible header.
  **How to apply:** any component that switches language or reads `isRtl`/`document.dir` must go through the shared context; never reintroduce local `useState` for language.

- Phase colors: backend cycle phases are `menstrual|follicular|ovulation|luteal`, but some translation keys use `menstruation`. Bridge phase→key/color through the phase helper; colors live as `--phase-*` CSS custom properties (HSL triplets) referenced via `hsl(var(--phase-*))`, so they respond to the active theme.
