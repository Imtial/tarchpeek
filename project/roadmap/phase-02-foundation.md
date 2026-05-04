# Phase 02: Foundation

Status: `done`
Owner: `user + OpenCode`
Last updated: `2026-05-04`

## Goal

Set up the app architecture, shared primitives, and engineering baseline needed to build the MVP without rework.

## Scope

- Initialize React Native project structure in `/app`
- Set up navigation for mobile and TV-aware flows
- Create API client and request/error normalization
- Persist server configuration and auth token
- Add query/state/storage foundations
- Create design tokens and basic layout primitives
- Establish TV focus helpers and focus-safe components
- Build loading, error, and empty state components

## Deliverables

- Stable app shell
- App bootstrap and provider wiring
- Connect/reconnect flow
- Reusable screen scaffolds and list/card primitives
- Repository-level developer conventions for the app

## Exit Criteria

- App can cold start, reconnect, and fetch protected API data reliably
- Navigation shell works on Android phone and Android TV
- Shared component foundation is sufficient for feature work

## Notes

- Keep abstractions minimal.
- Do not build large feature screens in this phase.
- Preserve playback behavior parity during extraction; resume/autoplay/progress-sync regressions are a Phase 02 failure mode.
- Conventions reference: `project/conventions/app-architecture.md`.

## Unit-of-Work TODO Bundles

### Bundle A: App structure extraction from spike shell

- [x] Define target module boundaries and file layout for `app/App.tsx` split (`screens`, `services`, `storage`, `playback`, `ui`).
- [x] Extract connection form and hydration/save logic into a dedicated connect screen module with unchanged behavior.
- [x] Extract TubeArchivist API helpers (video fetch + progress post) into a service module using `new URL(...)` composition.
- [x] Add `TubeArchivistClient` factory to centralize auth headers and remove repeated `serverUrl`/`apiToken` params from per-call APIs.

### Bundle B: Playback flow isolation with behavior parity

- [x] Extract player screen and player event wiring into a playback module while preserving current resume/autoplay behavior.
- [x] Isolate progress checkpoint strategy constants and sync routine into playback-side helpers to reduce `App.tsx` coupling.
- [x] Verify manual parity on Android for load, resume, autoplay, and progress-post behavior after extraction.

### Bundle C: Foundation baseline cleanup

- [x] Reduce root `App.tsx` to orchestration-only responsibilities (routing shell + top-level state boundaries).
- [x] Document Phase 02 architecture conventions for future phases (naming, module ownership, boundary rules).
