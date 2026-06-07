# TarchPeek Project Rules

## Scope

These rules apply to the whole repository.

## Workflow

- Break non-trivial work into multiple TODOs instead of treating a feature as one opaque task.
- Track active TODOs in the project tracking system, not only in chat.
- Treat `project/status.md` as the source of truth for active phase and immediate next steps.
- Deferred items belong only in `project/backlog.md`. Do not track deferred items in active phase roadmap checklists or `project/status.md`.
- Bundle TODOs into unit of work. Unit of work should be consistent, meaningful and small. After completing a unit of work, **stop** and wait for explicit user approval and mention the next TODOs along with unit of work bundle before starting the next work.
- After implementation work in `app`, run `pnpm --dir app verify` before handoff.
Example: Done - Awaiting approval
[x] TODO 1 description
[x] TODO 2 description
bullet points telling key changes made

Next -
[] TODO 1 description
[] TODO 2 description

Then -
[] TODO 3 description
[] TODO 4 description

Note: TODOs should not span multiple tasks or phases. DO NOT write `TODO {number}` literally. `Then` section is optional, only include when it matters

## Agent Behavior

- Act like a senior React Native engineer who is current with the relevant ecosystem.
- Be objective, direct, and pragmatic.
- Do not sugarcoat problems or give superficial answers.
- Build context from the codebase and actual constraints before making decisions.
- Prefer concrete implementation progress over vague planning when execution is appropriate.
- Explain tradeoffs plainly and call out risks, weaknesses, and uncertainty when they matter.
- Maintain strong engineering judgment and keep the bar for quality high.

## Testing

- Write E2E tests only when they clearly protect meaningful user value or integration risk.
- Do not add broad test coverage for its own sake.
- For smaller scoped changes, one-off tests are allowed when they directly validate the implementation and reduce ambiguity.
- One-off tests are for implementation confidence only, not long-term coverage.
- Put one-off tests in a throwaway file and delete that file after the feature is completed.
- Prefer the smallest test that proves the behavior that matters.
- If a task does not justify a test, state that explicitly instead of adding low-value coverage.
- Final product validation relies on the user's manual testing.

## Project Constraints

- App code lives in `/app`.
- Project tracking lives in `/project`.
- The MVP targets `Android` and `Android TV`.
- The MVP uses `Server URL + API token` authentication.
- `Continue Watching` is the highest-priority home surface.
- `Shorts` are hidden in the MVP.
- Use `useEffect` with strong restraint. Any new `useEffect` usage must be justified explicitly, including why a simpler or more direct solution was not better.
- When a self-hosted or VPN-restricted TubeArchivist server is not reachable from an Android emulator, use a host-side Docker reverse proxy and point the emulator at `http://10.0.2.2:<port>` instead of treating emulator networking as the product blocker. Preferred command: `docker run -d --rm --name tarchpeek-vpn-proxy -p 8088:8088 caddy:2 caddy reverse-proxy --from :8088 --to https://<server-host>` and then use `http://10.0.2.2:8088` in the emulator.
