# App Architecture Conventions (Phase 02)

Last updated: `2026-05-04`

## Purpose

Define naming, ownership, and boundary rules used by the app foundation so later phases can add features without rework.

## Naming

- Components and screens: `PascalCase` file and symbol names (example: `ConnectScreen.tsx`, `PlayerScreen.tsx`).
- Hooks and controller modules: `use*` prefix (example: `useAppContentController.ts`).
- Services: domain-focused file names in `src/services` (example: `tubeArchivist.ts`).
- Generated API code: always lives under `src/api/generated/**`; do not hand-edit generated files.
- Storage modules: capability-based names in `src/storage` (example: `connectionStorage.ts`).

## Module Ownership

- `App.tsx`
  - App root/provider composition.
  - High-level screen routing decisions only.
  - Must not own domain workflows or side-effect-heavy feature logic.
- `src/app/useAppContentController.ts`
  - Connect-screen orchestration state.
  - Connection hydration/save flow.
  - Test-video load workflow and transition to player route state.
- `src/screens/*.tsx`
  - UI rendering and local interaction behavior for that screen.
  - Playback-screen event wiring belongs in `PlayerScreen`.
- `src/screens/playbackProgress.ts`
  - Playback checkpoint constants and sync routine logic.
- `src/services/tubeArchivist.ts`
  - TubeArchivist API-facing domain operations and payload shaping.
- `src/api/fetcher.ts`
  - HTTP transport configuration and cross-request concerns (e.g., interceptors).
- `src/storage/*.ts`
  - Device persistence IO and normalization for storage payloads.

## Boundary Rules

- Screen modules call service functions through typed interfaces; they do not build endpoint URLs.
- Transport/base URL configuration is centralized in API/fetcher layer.
- `useEffect` usage is restrained:
  - Allowed for lifecycle hydration and subscription-like workflows.
  - Avoid using effects for pure derivation that can be computed directly.
- Keep progress-sync behavior centralized in helper modules and referenced by `PlayerScreen`.
- Avoid cross-imports from `src/screens` into `src/services` or `src/storage`.
- Keep generated code as source-of-truth for endpoint signatures; extend behavior in non-generated wrappers/helpers only.

## Non-Goals for Phase 02

- No subtitle-scope expansion.
- No feature-surface expansion beyond connection + playback validation workflow.
