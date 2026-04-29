# 0007 - Design System Foundation

Status: `accepted`
Date: `2026-04-29`

## Decision

Adopt a token-first design system baseline for app UI and require new screens/components to consume shared tokens rather than hardcoding visual primitives.

## Initial Scope

- Introduce shared design tokens for color, spacing, and radii in `/app/src/design/tokens.ts`.
- Introduce a theme registry in `/app/src/design/themes.ts` with two selectable palettes: `Deep Emerald` (default) and `Mint Breeze`.
- Manage active theme via Context Provider (`/app/src/design/ThemeProvider.tsx`) so new modules consume theme state without prop drilling.
- Keep Phase 02 token usage focused on currently extracted screens and new foundation modules.
- Defer advanced typography scale, component variants, and motion primitives to later Phase 02/03 work after module extraction stabilizes.

## Why

- The spike-era single-file UI contains repeated hardcoded values that slow refactors and create visual drift.
- A small token baseline improves readability now while keeping implementation light enough for Foundation.
- This gives us a stable contract before broader feature work (browsing and playback MVP).

## Tradeoffs

- Short-term inconsistency remains in screens not yet migrated to tokens.
- Token surface is intentionally minimal today and will expand as component primitives are extracted.
