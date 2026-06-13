# Project Status

Status: `in_progress`
Current phase: `Phase 04 - Playback MVP`
Last updated: `2026-06-13`

## Product Summary

Build a React Native client for TubeArchivist with its own identity and design language.
The MVP targets `Android` and `Android TV`, prioritizes `Continue Watching`, hides `Shorts`, and favors intentional browsing over engagement-driven discovery.

## Current Focus

- Validate the core Android viewing loop end-to-end against the seeded local TubeArchivist fixture
- Preserve launch-critical playback, progress sync, and browse-to-player continuity while improving measured UX quality
- Keep scope tight; capture architecture and platform risks explicitly instead of expanding feature scope

## Active Constraints

- App code lives in `/app`
- Project tracking lives in `/project`
- MVP auth is manual `Server URL + API token`
- One saved server is the default assumption
- `Continue Watching` is the highest-priority home surface
- `Shorts` stay hidden in the MVP
- New `useEffect` usage needs explicit justification over simpler alternatives

## Known Risks

- TubeArchivist media playback may behave differently from JSON API auth behavior
- Local-network HTTP or self-signed setups may still introduce Android networking issues
- Android TV focus quality can regress if not validated continuously
- TubeArchivist API is usable but not a stable third-party contract
- Android TV emulator reliability on local macOS remains weak, reducing near-term TV confidence

## Validated Baseline

- Resume source in-app currently comes from `/api/video/<video_id>/` metadata, not `GET /api/video/<video_id>/progress/`
- Progress persistence is validated through `POST /api/video/<video_id>/progress/` and visible in TubeArchivist UI
- Local automation still cannot rely on one consistent cross-endpoint progress read path; resume E2E uses the seeded Redis-backed fixture instead
- `react-native-video` v7 remains the playback baseline for this repo/runtime
- App root orchestration, playback flow, and TubeArchivist client responsibilities have already been split into more focused modules

## Immediate Next Steps

1. Playback MVP validation and stabilization
   - Keep validating the Android viewing loop against the seeded local TubeArchivist fixture
   - Prioritize launch-critical playback, progress sync, and browse-to-player continuity issues over new feature work
   - Capture remaining platform and launch risks explicitly instead of expanding scope

## Recent Completed Bundles

- Bundle N: React Doctor app cleanup (implemented and approved)
  - Fixed the validated React Doctor findings that had safe code changes across browsing, player, theme, and TubeArchivist client code
  - Reduced React Doctor findings from `23` to `4`
  - Remaining findings after validation:
    - `app/src/app/AndroidOrientationPolicyProvider.tsx`: `no-initialize-state` remains because the native auto-rotate value is exposed asynchronously, not as a synchronous initial snapshot
    - `app/src/screens/browsing/hooks/usePagedResource.ts`: `async-defer-await` remains because the suggested rewrite would weaken the unmount-safety guard in React Native
  - Validation: `pnpm --dir app verify` clean
  - Validation: `npx react-doctor@latest --verbose`

- Bundle L: startup auto-connect flow cleanup (implemented and awaiting approval)
  - Replaced the old auth bootstrap booleans with an explicit connection-state model: `bootstrapping`, `disconnected`, `connecting`, `connected`
  - Added a dedicated startup screen to prevent the connect-form flash before Home
  - Failed auto-connect now falls back to the connect form with saved credentials prefilled and the existing error banner intact
  - Validation: `pnpm --dir app verify` clean

- Bundle F: Android playback performance validation + targeted optimization (completed)
  - Measured `Connect -> Home`, `Home -> Player`, and `Player -> Back` on Android before and after a focused optimization pass
  - Biggest improvement was `Player -> Back`, which moved from visibly poor return-path jank to acceptable browse return behavior on the measured emulator path
  - Follow-up performance work should stay evidence-driven, not speculative

## Current Architecture Notes

- Browsing uses nested `native-stack` detail flows in `app/src/navigation/BrowsingTabs.tsx`
- Shared paging behavior is centralized in `app/src/screens/browsing/hooks/usePagedResource.ts`
- Channel-detail orchestration is centralized in `app/src/screens/browsing/hooks/useChannelDetailResource.ts`
- TubeArchivist client responsibilities are split across transport, mappers, and client modules under `app/src/services/tubeArchivist/`

## Phase Summary

| Phase | Name | Status | Outcome |
| --- | --- | --- | --- |
| 00 | Product Definition | done | Lock scope, UX principles, and repo conventions |
| 01 | Feasibility Spike | done | Proved auth, protected playback, and progress sync |
| 02 | Foundation | done | App shell extraction, playback isolation, and architecture conventions baseline complete |
| 03 | Browsing MVP | done | Delivered Home, Channels, Playlists, and Search browsing surfaces |
| 04 | Playback MVP | in_progress | Deliver dependable end-to-end viewing |
| 05 | Hardening | planned | Raise quality to repeat-use stability |
| 06 | Beta | planned | Dogfood, triage, and prepare first beta |
