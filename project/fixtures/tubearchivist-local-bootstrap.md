# Local TubeArchivist Bootstrap for Android E2E

This runbook is for local-only Android validation and E2E execution with a persistent TubeArchivist dataset.

## Goal

- Keep setup cost high only once.
- Reuse persistent Docker volumes between runs.
- Point Android emulator to host TubeArchivist via `10.0.2.2`.

## Prerequisites

- Docker Desktop running.
- Android emulator available.
- Default local credentials match `project/fixtures/tubearchivist-compose.yml` unless overridden.

## One-Time Setup

1. Export volume list (or use defaults below):
   - `export TA_VOLUMES="<space-delimited-runtime-volume-names>"`
2. Bootstrap + seed + capture deterministic baseline in one command:
   - `npm --prefix app run ta:seed:bootstrap`
3. Optional: if you need a custom login/token flow, set one of:
   - `TA_API_TOKEN="..."` (skip login)
   - or `TA_USERNAME` and `TA_PASSWORD` (used for login + token retrieval)

## Deterministic Restart Workflow

- Scripts are owned by app runtime tooling at `app/scripts/tubearchivist-manager.mjs`.
- Start each test run from frozen seed state:
  - `export TA_VOLUMES="<space-delimited-runtime-volume-names>"`
  - `npm --prefix app run ta:seed:reset-start`
- Stop after test run:
  - `npm --prefix app run ta:seed:stop`
- This guarantees each new run starts from the same post-seeding snapshot.

## Required Environment Variables for Scripts

- `TA_VOLUMES` (required): runtime Docker volumes to reset and restore from `<volume>_seed`
- `COMPOSE_FILE` (optional): defaults to `project/fixtures/tubearchivist-compose.yml`
- `PROJECT_NAME` (optional): defaults to `tarchpeek`
- `TA_BASE_URL` (optional): defaults to `http://localhost:8000`
- `TA_API_TOKEN` (optional): use existing token and skip login
- `TA_USERNAME` (optional): defaults to `tarchpeek`
- `TA_PASSWORD` (optional): defaults to `tarchpeek-local`
- `TA_SEED_FILE` (optional): defaults to `project/fixtures/tubearchivist-seed-videos.txt`

Default volume list for `project/fixtures/tubearchivist-compose.yml`:

- `TA_VOLUMES="tarchpeek_ta_media tarchpeek_ta_cache tarchpeek_ta_redis tarchpeek_ta_es"`

## Emulator Networking

- Use `http://10.0.2.2:<port>` in app server URL.
- If your local TubeArchivist is on `http://localhost:8000`, use:
  - `http://10.0.2.2:8000`
- The local fixture compose file must allow both hosts in `TA_HOST` so Django accepts emulator API requests:
  - `TA_HOST=http://localhost:8000 http://10.0.2.2:8000`

## Suggested Validation Dataset

- At least 3 completed videos in archive.
- At least one playlist with 2+ playable entries in known order.
- At least one partially watched item for resume testing.

## Manual Reset Strategy

- Prefer seeded reset scripts over manual cleanup.
- If state drifts, run reset-and-start again instead of manual watched/progress edits.

## Android Validation Targets (Bundle E)

- Connect and save server/token.
- Open from Home/Continue/Playlist/Search and verify playback starts.
- Verify resume starts from saved position for partially watched item.
- Verify progress sync on pause, back-exit, and playback end.
- Verify autoplay next-in-queue when list context exists.
- Verify end-of-queue remains no-op.

## Notes

- Android TV-specific focus/remote validation is deferred until emulator/device reliability is restored.
- This runbook intentionally avoids CI assumptions.
