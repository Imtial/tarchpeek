# Phase 04: Playback MVP

Status: `planned`
Owner: `user + OpenCode`
Last updated: `2026-04-22`

## Goal

Deliver a dependable viewing flow from content selection to completed playback.

## Scope

- Video detail screen
- Full-screen player
- Resume playback from saved progress
- Mark watched/unwatched
- Playlist next/previous navigation where available
- TV remote controls and focus-safe overlays
- Subtitle support if reliable from Phase 01 findings

## Deliverables

- End-to-end browse-to-play flow
- Stable progress sync behavior
- Watch-state updates reflected back into browsing surfaces

## Exit Criteria

- A normal viewing session works on Android and Android TV without obvious friction
- Resuming progress is reliable
- Playback controls feel native enough for repeated use

## Notes

- If subtitle support is unreliable, ship without it and document the limitation.
- Do not let optional player features delay the core playback path.
