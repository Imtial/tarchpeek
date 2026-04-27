# Phase 01: Feasibility Spike

Status: `in_progress`
Owner: `user + OpenCode`
Last updated: `2026-04-27`

## Goal

Prove that a React Native Android/Android TV client can authenticate against TubeArchivist, play protected media, and sync progress reliably enough to justify full product implementation.

## Scope

- Bootstrap the minimal React Native app shell in `/app`
- Implement server URL + API token input and persistence
- Build a minimal TubeArchivist API client
- Fetch one known-good video record from a real server
- Attempt authenticated media playback
- Attempt subtitle playback if present
- Send and verify progress updates
- Validate Android TV remote interaction on the playback path

## Deliverables

- Minimal app shell
- Connect screen
- Simple video playback test screen
- Written findings on auth and playback behavior
- List of backend constraints or gaps if discovered

## Exit Criteria

- One known-good video plays on Android phone
- One known-good video plays on Android TV
- Progress updates persist correctly
- Subtitle behavior is known, even if unsupported
- Any blockers are specific and documented

## Risks

- Protected media may not honor API-token-based playback the same way as JSON endpoints
- Subtitles may require separate auth handling
- Codec/container compatibility may be inconsistent across archives
- Local-network transport configuration may cause Android restrictions or playback failures

## Notes

- This phase is the technical gate for the rest of the roadmap.
- If playback is not reliable here, do not continue into broad UI implementation.

## Progress Sync TODOs

- [x] TODO 1: Add first app-side progress sync path by posting a checkpoint to `/api/video/<video_id>/progress/` when leaving the player.
- [x] TODO 2: Improve checkpoint strategy (periodic or lifecycle-driven) so progress does not depend only on pressing Back.
- [ ] TODO 3: Verify progress persistence against a real TubeArchivist server and document request/response behavior.

## Findings

- TubeArchivist API authentication works with `Authorization: Token <token>` against `/api/video/<video_id>/`.
- A real server video record was fetched successfully from `https://tube.vpn.imtial.com/api/video/7Pa7nGiFfvs/` and returned a playable `media_url` plus player metadata.
- The protected media URL also accepted the same token header on direct media requests.
- Emulator access to the VPN-backed host was blocked until a host-side Docker reverse proxy was introduced and the app pointed at `http://10.0.2.2:8088`.
- Local sample playback and real TubeArchivist playback both failed under `react-native-video` v6 inside the app, even though the official v6 sample app worked on the same emulator.
- Root cause was integration mismatch with the current app runtime: the React Native `0.85` app is effectively on the New Architecture path, while the working v6 sample was validated on an older architecture path.
- Migrating the app to `react-native-video` `7.0.0-beta.9` plus `react-native-nitro-modules` resolved local and remote playback inside this app.
- After the migration, all of the following were verified manually on Android:
- bundled/local video playback works
- authenticated TubeArchivist playback works
- physical device installation works after `adb reverse tcp:8081 tcp:8081` for Metro access
- Subtitle behavior is currently known only for the tested real video: the API returned `subtitles: []`, so subtitle rendering is still unproven for a video that actually has subtitle tracks.
- App-side progress sync now sends a checkpoint POST to `/api/video/<video_id>/progress/` when leaving the player, but end-to-end persistence is not verified yet.
- Progress checkpoints are now attempted periodically during playback (15s interval) and on pause/end state transitions, so sync no longer depends only on pressing Back.

## Current Assessment

- Authenticated playback on Android is feasible.
- Local-network or VPN-restricted servers may require explicit developer tooling during testing, but this is an environment issue rather than a protocol blocker.
- `react-native-video` v7 is the correct integration direction for this repository's current React Native/runtime setup.
- Subtitle support and progress sync remain open items before Phase 01 can be considered complete.
