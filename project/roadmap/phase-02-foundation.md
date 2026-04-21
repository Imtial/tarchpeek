# Phase 02: Foundation

Status: `planned`
Owner: `user + OpenCode`
Last updated: `2026-04-22`

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
