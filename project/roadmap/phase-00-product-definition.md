# Phase 00: Product Definition

Status: `in_progress`
Owner: `user + OpenCode`
Last updated: `2026-04-22`

## Goal

Remove ambiguity about what the product is, who it is for, what the MVP includes, and what it explicitly refuses to become in v1.

## Scope

- Define the product principles
- Fix MVP platform targets
- Fix MVP authentication model
- Define navigation and discovery priorities
- Define what is excluded from MVP
- Establish repository and tracking conventions

## Product Principles

- Intentional access over endless consumption
- Fast retrieval of known-good archived content
- Calm discovery over algorithmic recommendation
- TV and phone are both first-class, but not identical UX targets
- Self-hosted and local-network usage are primary realities

## Locked Decisions In This Phase

- Platform targets: `Android`, `Android TV`
- Home priority: `Continue Watching` first
- `Shorts` are hidden in the MVP
- Authentication: `Server URL + API token`
- Typical server model: `one saved server`
- App identity: distinct from TubeArchivist web UI
- App code location: `/app`
- Project tracking location: repo root under `/project`

## MVP In Scope

- Connect to a TubeArchivist server
- Persist server URL and API token
- Browse home rails
- Search intentionally
- Browse channels and playlists
- Open video detail
- Play video
- Resume playback progress
- Mark watched/unwatched
- Deliver fluent Android TV remote navigation

## Explicitly Out Of Scope

- Admin settings and dashboards
- Complex username/password auth flows
- Multi-user account management
- Comments
- SponsorBlock
- Cast
- Notifications
- Offline downloads
- Download queue management
- Shorts-specific UX

## Deliverables

- Product principles and scope definition
- Concrete phase roadmap
- Decision records for major constraints
- Repo-level tracking structure

## Exit Criteria

- MVP boundaries are stable enough to start implementation
- Phase roadmap exists and is concrete
- Core product and architecture constraints are documented

## Notes

- This phase can close before any React Native code exists.
- The next meaningful risk is playback feasibility, not UI design.
