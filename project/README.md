# Project Tracking

This directory is the operating surface for the React Native client project.

## Structure

- `status.md`: single-page dashboard for current phase, blockers, and next steps
- `backlog.md`: deferred items that are explicitly out of current phase gates
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
- Decisions that materially affect scope, architecture, or UX go into `decisions/`.
- The MVP is consumption-focused. Admin and moderation workflows are intentionally excluded.
