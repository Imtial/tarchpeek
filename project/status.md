# Project Status

Status: `in_progress`
Current phase: `Phase 04 - Playback MVP`
Last updated: `2026-05-26`

## Product Summary

Build a React Native client for TubeArchivist with its own identity and design language.
The MVP targets `Android` and `Android TV`, prioritizes `Continue Watching`, hides `Shorts`, and favors intentional browsing over engagement-driven discovery.

## Current Focus

- Validate the core Android viewing loop end-to-end against the seeded local TubeArchivist fixture
- Prove resume, progress sync, and queue continuity behaviors that already exist in the product
- Capture remaining launch risks explicitly instead of expanding scope with new major features
- Defer Android TV reliability work until emulator/device validation is practical again

## Active Constraints

- App code must live in `/app`
- Tracking must live at repo root
- Primary deployment context is self-hosted, usually local network
- MVP auth is manual `API token` entry
- One saved server is the default assumption

## Known Risks

- TubeArchivist media playback may behave differently from JSON API auth
- Local-network HTTP/self-signed setups may introduce Android networking issues
- Android TV focus quality can regress if not validated continuously
- TubeArchivist API is usable but not a stable third-party contract
- Android TV emulator is currently unreliable on local macOS environment, reducing near-term TV validation confidence

## Foundation Outcomes (Phase 02)

- Resume source in-app is read from `/api/video/<video_id>/` metadata, not from `GET /api/video/<video_id>/progress/` in the current environment.
- Progress persistence is validated via `POST /api/video/<video_id>/progress/` and confirmed visible in the TubeArchivist UI.
- Local TubeArchivist resume/progress read paths are inconsistent for automation: `POST /api/video/<video_id>/progress/` succeeds, but subsequent API reads do not provide one reliable cross-endpoint readback path, so the local resume E2E verifies persisted state from the Redis-backed fixture instead.
- `react-native-video` v7 remains the baseline playback integration direction for this repository/runtime.
- App root orchestration was reduced and playback/connection concerns were extracted into focused modules.

## Immediate Next Steps

1. Bundle F (active): Android playback performance validation + targeted optimization
   - Treat feature scope as launch-ready; focus on measured performance quality for core viewing loop
   - Measure baseline for `Connect -> Home`, `Home -> Player`, and `Player -> Back` on Android using RN DevTools profiler + FPS sampling
   - Record evidence and baseline metrics directly in this file before making optimizations
   - Classify only measured bottlenecks as Blocker/High/Medium; avoid speculative performance work
   - Apply only MVP-safe fixes (hot-screen re-render reduction, list rendering sanity checks, no broad architecture changes)
   - Re-measure the exact same flows and record before/after deltas (Measure -> Optimize -> Re-measure -> Validate)
   - Defer non-blocking follow-up optimizations to `project/backlog.md`

## Bundle Progress Notes

- Bundle A: implemented and approved
- Bundle B: implemented and approved
- Bundle C: implemented and approved
  - Implemented: in-player watched toggle with outlined/filled check-circle state
  - Implemented: watched-last ordering for Home/Continue browse lists (search ordering untouched)
  - Implemented: conditional refetch-based reflection path on player close (single source of truth)
  - Implemented: unified video-list/card container shared by Home/Continue/Search
  - Implemented: browse-card metadata upgrade (channel logo + channel name + human-friendly view count)
- Bundle D: implemented and approved
  - Implemented: playlist list + playlist detail layout correction pass
  - Implemented: preserve browsing tab/stack state when exiting player
  - Implemented: responsive single-press player back exit (non-blocking final progress sync)
  - Implemented: centralized app constants in single namespaced module (`TARCHPEEK_CONSTANTS`)
  - Implemented: autoplay next-in-queue on playback end when queue context exists (end-of-queue is no-op)
- Bundle E: local Android emulator home-feed fetch path unblocked
  - Implemented: local TubeArchivist fixture now accepts both `localhost` and `10.0.2.2` host headers via `TA_HOST`
  - Implemented: dedicated emulator-network verifier now checks the exact emulator-targeted host-header path before Maestro runs
  - Implemented: connect flow now requires authenticated TubeArchivist validation before entering browse surfaces
  - Implemented: invalid-token handling now keeps the connect screen visible and shows an explicit error banner
  - Implemented: Maestro Android lane covering bootstrap connect, home-feed render, invalid-token error, and browse-to-player-back
  - Implemented: resume E2E setup now seeds deterministic local progress, verifies persisted position directly from the local Redis-backed TubeArchivist state, and resolves the actual Home card selector used by Maestro
  - Implemented: screen-level browsing test anchors plus a dedicated player-back lane covering return to `Home` and `Search`
  - Implemented: search submit now dismisses the keyboard so Android result taps reliably open player after querying
  - Validation note: Maestro is now the mainline Android E2E framework for launch-critical flows
   - Validation note: `npm run e2e:test:android:resume` now passes against the local seeded fixture
   - Validation note: `node scripts/run-maestro-android.mjs maestro/scenarios/player-back-origin-surfaces.yaml` now passes
- Bundle F: Android playback performance validation (in progress)
  - Measurement runbook (baseline then re-measure):
    - Build context: Android debug build on emulator/device, same runtime target for all captures in a pass
    - Flow A: `Connect -> Home` (from submit tap until first populated Home list render)
    - Flow B: `Home -> Player` (from first Home card press until first stable playing state)
    - Flow C: `Player -> Back` (from back action until browse surface is interactive again)
    - For each flow, capture: Profiler commit timeline screenshot + max commit duration + count of commits over 16ms
    - For each flow, capture FPS sample: average FPS, minimum FPS, and visible jank notes
  - Planned measurement artifacts:
    - React DevTools Profiler commit timelines for `Connect -> Home`, `Home -> Player`, and `Player -> Back`
    - FPS samples for the same flows with noted device/emulator context and build type
    - Risk classification table (Blocker/High/Medium) tied to measured evidence only
  - Evidence template (fill with baseline and post-fix):
    - `Connect -> Home`: avg FPS `42.6`, min FPS `11.6`, max commit `48`ms (p90), commits >16ms `112/210` frame deadlines missed, risk `High` (baseline)
    - `Home -> Player`: avg FPS `30.0`, min FPS `27.4`, max commit `150`ms (p90), commits >16ms `40/89` frame deadlines missed, risk `High` (baseline)
    - `Player -> Back`: avg FPS `11.4`, min FPS `1.9`, max commit `250`ms (p90), commits >16ms `32/53` frame deadlines missed, risk `High` (baseline)
  - Baseline capture #1 (`Connect -> Home`, Android emulator `emulator-5554`, Maestro flow `bootstrap-seeded-flow`):
    - Source: `adb shell dumpsys gfxinfo com.tarchpeek.maestro` collected immediately after flow run
    - Frames rendered: `210`
    - Janky frames: `112` (`53.33%`)
    - Percentiles: p50 `17`ms, p90 `48`ms, p95 `53`ms, p99 `97`ms
    - Deadline misses: `112`; slow UI thread: `34`; slow draw commands: `91`
    - Note: this capture is valid as baseline trend data but does not include direct avg/min FPS yet; next pass will add FPS overlay sampling for parity with skill guidance
  - Baseline capture #2 (`Home -> Player`, Android emulator `emulator-5554`, Maestro flow `maestro/.runtime/measure-home-to-player.yaml`):
    - Source: `adb shell dumpsys gfxinfo com.tarchpeek.maestro` collected immediately after flow run
    - Frames rendered: `89`
    - Janky frames: `40` (`44.94%`)
    - Percentiles: p50 `30`ms, p90 `150`ms, p95 `300`ms, p99 `2900`ms
    - Deadline misses: `40`; slow UI thread: `28`; slow bitmap uploads: `3`; slow draw commands: `31`
    - Note: this capture indicates a much slower transition profile than target smoothness for open-player path; avg/min FPS still pending direct overlay sampling
  - Baseline capture #3 (`Player -> Back`, Android emulator `emulator-5554`, Maestro flow `maestro/.runtime/measure-player-back.yaml`):
    - Source: `adb shell dumpsys gfxinfo com.tarchpeek.maestro` collected immediately after flow run
    - Frames rendered: `53`
    - Janky frames: `32` (`60.38%`)
    - Percentiles: p50 `32`ms, p90 `250`ms, p95 `450`ms, p99 `2100`ms
    - Deadline misses: `32`; slow UI thread: `27`; slow bitmap uploads: `2`; slow draw commands: `18`
    - Note: this path currently profiles as the worst of the three measured flows by frame-time percentile spread and jank rate
  - FPS sampling method (non-interactive, avoids terminal/UI prompts):
    - Command lane: `adb shell dumpsys gfxinfo com.tarchpeek.maestro framestats` after each Maestro flow
    - Aggregation: compute per-frame durations from `IntendedVsync` and `FrameCompleted` where `Flags=0`; derive `avg FPS = 1 / mean(frameDuration)` and `min FPS = 1 / max(frameDuration)`
    - Captured FPS baselines:
      - `Connect -> Home`: avg `42.6`, min `11.6` (frames sampled: `94`)
      - `Home -> Player`: avg `30.0`, min `27.4` (frames sampled: `119`)
      - `Player -> Back`: avg `11.4`, min `1.9` (frames sampled: `56`)
  - Implemented (pre-measure safe optimization pass):
    - `VideoResultsList` now reuses a shared `Intl.NumberFormat` instance for compact view-count formatting instead of recreating one per render
    - `VideoResultsList` now memoizes queue video IDs and reuses them when building player queue context on open
    - `FlashList` `renderItem` path in `VideoResultsList` is now memoized to reduce avoidable function churn during list updates/focus transitions
  - Implemented (measured bottleneck fix pass #1):
    - `HomeScreen` refresh no longer re-enters full loading-skeleton mode once initial data has loaded; refresh stays in-place and updates data when fetch completes
    - `ContinueWatchingScreen` uses the same refresh behavior to avoid destructive reload on browse refresh triggers
    - Rationale: `Player -> Back` was dominated by heavy refresh-time churn after player close; this reduces layout churn during return transition without changing data contracts
  - Bottleneck classification from baseline evidence:
    - `Player -> Back`: `Blocker` (baseline avg FPS `11.4`, min `1.9`, p90 `250ms`, janky `60.38%`)
    - `Home -> Player`: `High` (baseline avg FPS `30.0`, p90 `150ms`, janky `44.94%`)
    - `Connect -> Home`: `High` (baseline avg FPS `42.6`, p90 `48ms`, janky `53.33%`)
  - Re-measure after fix pass #1 (same emulator and flow set):
    - `Connect -> Home`: avg FPS `44.3` (from `42.6`), min FPS `14.5` (from `11.6`), p90 `34ms` (from `48ms`), janky `51.94%` (from `53.33%`)
    - `Home -> Player`: avg FPS `30.5` (from `30.0`), min FPS `28.4` (from `27.4`), p90 `32ms` (from `150ms`), janky `14.46%` (from `44.94%`)
    - `Player -> Back`: avg FPS `40.8` (from `11.4`), min FPS `6.4` (from `1.9`), p90 `26ms` (from `250ms`), janky `4.29%` (from `60.38%`)
  - Working rule: no new `useEffect` unless explicitly justified against a simpler alternative
- Bundle G: thermo-nuclear maintainability audit + decomposition plan (active)
  - Scope lock:
    - Include: `app/src` and app test assets under `app/maestro`
    - Exclude: project tracking docs, TubeArchivist backend/fixtures, Orval-generated files under `app/src/api/generated`
  - TODO bundle 1 (completed): baseline architecture inventory + hotspot ranking
    - Produce file-size and responsibility map for non-generated `app/src`
    - Identify structural hotspots (god modules, repeated orchestration/state machines, branch-density growth)
    - Record findings severity with concrete file/line anchors
  - TODO bundle 1 findings (severity-ranked):
    - `High`: service-layer god module + boundary blur in `app/src/services/tubeArchivist.ts` (525 LOC); transport, mapping, and feature orchestration are co-located (`:225`, `:289`, `:414`, `:455`)
    - `High`: repeated pagination/load state machines across browsing screens, causing parallel spaghetti growth in `app/src/screens/browsing/ContinueWatchingScreen.tsx`, `HomeScreen.tsx`, `ChannelsScreen.tsx`, and `PlaylistsScreen.tsx`
    - `Medium`: `app/src/screens/PlayerScreen.tsx` (511 LOC) couples playback event orchestration with dense metadata/focus UI branches; extraction target for session logic and presentation split
    - `Medium`: app-mode/control ownership is diffuse across `app/src/app/useAppContentController.ts` and `app/App.tsx` with awkward branch shape at `app/App.tsx:56`
    - `Medium`: test coverage is mostly smoke-level Maestro flows (`app/maestro/tests`) with no TS/TSX unit/integration tests for paging merge/dedupe and progress checkpoint logic
    - `Low`: ad-hoc screen-level remapping in `app/src/screens/browsing/PlaylistDetailScreen.tsx:75` duplicates data-shape concerns outside canonical mapper ownership
  - TODO bundle 2 (completed): design-level refactor plan with bounded slices
    - Define target module boundaries and ownership (`service`, `mapper`, `screen`, `hook`)
    - Propose deletion-first simplifications ("code-judo" moves) for top hotspots
    - Sequence implementation into small bundles with rollback-safe ordering
  - TODO bundle 2 plan (approved-for-implementation sequence):
    - Target boundaries:
      - `app/src/services/tubeArchivist/taTransport.ts`: raw endpoint IO + auth header handling only
      - `app/src/services/tubeArchivist/taMappers.ts`: all API->UI model mapping (`Video`, playlists, channels, search result hydration fallbacks)
      - `app/src/services/tubeArchivist/taClient.ts`: feature-level orchestration (`fetchHomeFeed`, `fetchPlaylistDetail`, `searchArchive`) composed from transport + mappers
      - `app/src/screens/browsing/hooks/usePagedResource.ts`: canonical paging/loading/windowing state machine shared by Home/Continue/Channels/Playlists
      - `app/src/screens/player/usePlayerSession.ts`: playback checkpoint/back-exit/autoplay-next orchestration; `PlayerScreen.tsx` becomes presentation-first
    - Deletion-first code-judo moves:
      - Delete repeated screen-level pagination orchestration by moving all first-load/load-more/isMounted patterns into `usePagedResource`
      - Delete screen-level data-shape remapping in `PlaylistDetailScreen` by lifting mapping into service mapper layer
      - Delete branching awkwardness in `App.tsx` by introducing explicit app mode derivation in controller (`connect`, `browse`, `player-overlay`)
      - Delete service god-object structure by splitting `tubeArchivist.ts` into transport/mappers/client modules with strict ownership
    - Rollback-safe bundle order:
      - Bundle 3A: extract `usePagedResource` and migrate one screen (`ContinueWatchingScreen`) first
      - Bundle 3B: migrate remaining paging screens (`Home`, `Channels`, `Playlists`) to `usePagedResource`
      - Bundle 3C: split `tubeArchivist` into transport + mappers + client while preserving exported client contract
      - Bundle 3D: extract `usePlayerSession` and slim `PlayerScreen` without behavior changes
      - Bundle 3E: controller/app-mode cleanup in `useAppContentController` + `App.tsx`
    - Validation gates per bundle:
      - No behavior-contract changes to `TubeArchivistClient` call sites unless explicitly staged
      - Manual smoke paths: connect, home list load-more, continue list load-more, channel/playlist open, search open video, player back, autoplay-next
      - Keep generated Orval files untouched; no edits under `app/src/api/generated`
  - TODO bundle 3 (then): execute first decomposition slice
    - Extract shared pagination/fetch orchestration from browsing screens into one canonical hook
    - Keep runtime behavior identical; run targeted smoke validation paths
    - Update status with before/after complexity deltas and remaining risks
  - TODO bundle 3 progress:
    - `3A` completed: extracted canonical paging hook at `app/src/screens/browsing/hooks/usePagedResource.ts`
    - `3A` completed: migrated `app/src/screens/browsing/ContinueWatchingScreen.tsx` to use the shared hook
    - `3A` behavior guard: watched-last ordering preserved via injected merge policy in `ContinueWatchingScreen`
    - `3A` validation: lint clean for changed files via `npx eslint src/screens/browsing/ContinueWatchingScreen.tsx src/screens/browsing/hooks/usePagedResource.ts`
    - `3A` note: package scripts do not provide a standalone TS typecheck command in current app setup; full runtime smoke validation still pending manual pass
    - `3B` completed: migrated `app/src/screens/browsing/HomeScreen.tsx` to `usePagedResource` with existing home page-window merge semantics preserved
    - `3B` completed: migrated `app/src/screens/browsing/ChannelsScreen.tsx` to `usePagedResource` with existing append merge semantics preserved
    - `3B` completed: migrated `app/src/screens/browsing/PlaylistsScreen.tsx` to `usePagedResource` with existing page-window + dedupe semantics preserved
    - `3B` validation: lint clean for changed files via `npx eslint src/screens/browsing/HomeScreen.tsx src/screens/browsing/ChannelsScreen.tsx src/screens/browsing/PlaylistsScreen.tsx src/screens/browsing/hooks/usePagedResource.ts`
    - `3C` completed: split `app/src/services/tubeArchivist.ts` responsibilities into:
      - `app/src/services/tubeArchivist/taTransport.ts` (endpoint IO + auth/base URL)
      - `app/src/services/tubeArchivist/taMappers.ts` (API -> app model mapping)
      - `app/src/services/tubeArchivist/taClient.ts` (feature orchestration + client factory/hook)
      - `app/src/services/tubeArchivist/types.ts` (service contract/data model types)
      - compatibility wrapper preserved at `app/src/services/tubeArchivist.ts` (existing import surface retained)
    - `3C` validation: lint clean (`npx eslint src/services/tubeArchivist.ts src/services/tubeArchivist/*.ts`)
    - `3C` validation: TS compile clean (`npx tsc --noEmit`)
    - `3C` validation: Android Maestro E2E passed (`4/4`, `3m 51s`)
    - `3D` completed: extracted player session orchestration from `app/src/screens/PlayerScreen.tsx` into `app/src/screens/usePlayerSession.ts`
    - `3D` behavior guard: kept playback event wiring, progress checkpoint syncing, watched toggle persistence, autoplay-next, and hardware back handling semantics unchanged
    - `3D` validation: lint clean (`npx eslint src/screens/PlayerScreen.tsx src/screens/usePlayerSession.ts`)
    - `3D` validation: TS compile clean (`npx tsc --noEmit`)
    - `3D` validation: Android Maestro E2E passed (`4/4`, `2m 29s`)
- Image caching: no dedicated app-level LRU cache planned; continue with platform-native `Image` caching behavior

## Phase Summary

| Phase | Name | Status | Outcome |
| --- | --- | --- | --- |
| 00 | Product Definition | done | Lock scope, UX principles, and repo conventions |
| 01 | Feasibility Spike | done | Proved auth, protected playback, and progress sync |
| 02 | Foundation | done | App shell extraction, playback isolation, and architecture conventions baseline complete |
| 03 | Browsing MVP | done | Delivered Home, Channels, Playlists, and Search browsing surfaces with explicit interaction and TV focus affordance baseline |
| 04 | Playback MVP | in_progress | Deliver dependable end-to-end viewing |
| 05 | Hardening | planned | Raise quality to repeat-use stability |
| 06 | Beta | planned | Dogfood, triage, and prepare first beta |
