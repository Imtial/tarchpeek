# Phase 01: Feasibility Spike

Status: `in_progress`
Owner: `user + OpenCode`
Last updated: `2026-04-26`

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
