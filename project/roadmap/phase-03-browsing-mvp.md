# Phase 03: Browsing MVP

Status: `in_progress`
Owner: `user + OpenCode`
Last updated: `2026-05-04`

## Goal

Deliver the non-player content discovery experience with a strong bias toward intentional browsing and low-friction retrieval.

## Scope

- Home screen with ordered rails
- Continue Watching rail as first priority
- Recently Added rail
- Unwatched rail
- Channels list and channel detail
- Playlists list and playlist detail
- Search screen with explicit search behavior
- Hide `Shorts` from navigation and browsing surfaces

## Mobile Specifications (Android Phone)

- Primary navigation uses bottom tabs: `Home`, `Channels`, `Playlists`, `Search`
- Phone browsing is portrait-first for MVP; tablet-specific layouts are out of scope in this phase
- Home remains finite and intentional: `Continue Watching` first, then `Recently Added`, then `Unwatched`
- Each home rail exposes explicit `See more` entry points instead of endless in-place expansion
- Discovery guardrails are moderate:
  - No infinite home feed model
  - No autoplay previews on browsing surfaces
  - No algorithmic recommendation rail
  - Deeper browsing transitions are user-initiated and explicit
- Fluency requirements for phone UX:
  - Quick return paths to prior browsing context
  - Consistent back-stack behavior across tabs
  - Stable scroll restoration per tab
  - Clear loading, empty, and error states tuned for one-hand use
- Thumbnail treatment for mobile browsing cards:
  - Continue Watching items show a progress indicator on thumbnail (bar or percentage chip)
  - Unwatched/new items show a `New` chip on thumbnail when no resume progress exists
  - Progress and `New` indicators must remain glanceable but low-noise to preserve calm discovery

## Deliverables

- Functional content discovery flow
- Mobile and TV-compatible browsing screens
- Search and filtering path aligned with TubeArchivist data model

## Exit Criteria

- User can find relevant content without using the player screen first
- TV navigation across core browsing screens feels coherent and predictable
- Discovery remains finite and intentional rather than feed-like

## UX Rules

- No algorithmic recommendations
- No infinite discovery as the primary home model
- No visual emphasis on novelty over continuity
- Channels and playlists remain first-class navigation objects
- Keep first-screen home content finite rather than open-ended
- Require explicit intent actions for deeper browsing (`See more`, tab switch, or search submit)
- Do not override continuity signals with novelty-first ranking; `Continue Watching` remains dominant

## Notes

- Search should be explicit, fast, and quiet.
- Avoid crowding the home screen with low-value rails.
- Thumbnail progress and `New` chip treatment are part of Phase 03 browsing UI completion, not deferred to playback phase.
