# Project Tracking

This directory is the operating surface for the React Native client project.

## Current Status

- Current phase: `Phase 00 - Product Definition`
- Overall status: `in_progress`
- App code location: `/app`
- Primary targets: `Android`, `Android TV`
- Authentication for MVP: `Server URL + API token`

## Structure

- `status.md`: single-page dashboard for current phase, blockers, and next steps
- `roadmap/`: one file per delivery phase
- `decisions/`: durable product and architecture decisions

## Status Vocabulary

- `planned`
- `in_progress`
- `blocked`
- `done`
- `cancelled`

## Working Rules

- Each phase file owns its scope, deliverables, exit criteria, and blockers.
- `status.md` is the highest-signal summary and should stay current.
- Decisions that materially affect scope, architecture, or UX go into `decisions/`.
- The MVP is consumption-focused. Admin and moderation workflows are intentionally excluded.
