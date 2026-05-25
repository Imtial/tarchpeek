# Phase 04: Playback MVP

Status: `in_progress`
Owner: `user + OpenCode`
Last updated: `2026-05-25`

## Goal

Deliver a dependable viewing flow from content selection to completed playback.

## Scope

- Direct browse-to-player entry (no intermediate detail screen)
- Full-screen player
- Player-as-context metadata presentation (YouTube-style context in player screen)
- Resume playback from saved progress
- Mark watched/unwatched
- Playlist next/previous navigation where available
- TV remote controls and focus-safe overlays
- Subtitle support if reliable from Phase 01 findings

## Deliverables

- End-to-end direct browse-to-play flow
- Stable progress sync behavior
- Watch-state updates reflected back into browsing surfaces

## Exit Criteria

- A normal viewing session works on Android and Android TV without obvious friction
- Resuming progress is reliable
- Playback controls feel native enough for repeated use

## Notes

- If subtitle support is unreliable, ship without it and document the limitation.
- Do not let optional player features delay the core playback path.
- Current working assumption: feature scope is sufficient for an initial launch; remaining Phase 04 work is validation-first.

## Unit-of-Work TODO Bundles

### Bundle A: Player-as-context foundation

- [ ] Route all browsing video taps directly to player with consistent player-entry params.
- [ ] Expand player metadata context surface (title, channel, publish/duration context, description preview) in-player.
- [ ] Ensure Android TV focusable regions are explicit and usable in player metadata/control areas.

### Bundle B: Resume and progress hardening

- [ ] Normalize player start position from server resume metadata across all player entry paths.
- [ ] Harden checkpoint persistence across pause/background/back/end flows with one consistent strategy.
- [ ] Validate repeated open/close/reopen cycles preserve expected resume behavior.

### Bundle C: Watched/unwatched action and browse reflection

- [ ] Add explicit watched/unwatched action in player context actions.
- [ ] Persist watched state via backend endpoint.
- [ ] Reflect watched-state changes back into browsing surfaces after returning from player.

### Bundle D: Playlist continuity in player

- [x] Use list/playlist queue context when playback starts from browsing list context.
- [x] Autoplay next video when playback reaches end and queue has a next entry.
- [x] Keep end-of-queue behavior as no-op and preserve non-queue behavior.

### Bundle E: Android + Android TV playback validation

- [x] Prove emulator-based connect flow reaches authenticated Home rendering without `adb reverse` for API traffic.
- [x] Ensure invalid credentials stay on the connect screen with an explicit error state.
- [x] Make Maestro the mainline Android E2E framework for current launch-critical flows without introducing test-only app behavior.
- [x] Run manual playback sessions on Android target for direct-open, resume, watch-toggle, and autoplay-next flows.
- [ ] Seed local persistent TubeArchivist instance using `project/fixtures/tubearchivist-seed-videos.txt`.
- [ ] Follow local bootstrap runbook in `project/fixtures/tubearchivist-local-bootstrap.md`.
- [ ] Capture and enforce deterministic seed-volume restore cycle before each test run.
- [ ] Validate one-command bootstrap path: `npm --prefix app run ta:seed:bootstrap`.
- [x] Add local Android E2E baseline for connect -> open -> player visible -> back -> browse restored.
  Maestro passes this flow on Android.
- [x] Validate resume start behavior on a partially watched item.
  Maestro now passes `npm run e2e:test:android:resume` against the local seeded fixture after deterministic host-side progress seeding, Redis-backed state verification, and Home-card targeting fixes. App runtime still uses `videoDetails.player.position` when present and otherwise starts at `0`.
- [x] Track player back-navigation return-to-origin behavior for reachable browsing surfaces.
  Maestro now passes `node scripts/run-maestro-android.mjs maestro/scenarios/player-back-origin-surfaces.yaml`, covering return to `Home` and `Search` after opening player. Search submit now dismisses the keyboard so first result taps open player instead of only blurring the input.
- [ ] Defer Android TV validation until emulator/device reliability is restored and record the risk explicitly.
- [ ] Record pass/fail outcomes and remaining known risks in project tracking.
