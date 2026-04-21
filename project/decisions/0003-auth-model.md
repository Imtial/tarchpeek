# 0003: MVP Auth Model

Status: `accepted`
Date: `2026-04-22`

## Decision

Use `Server URL + API token` as the only MVP authentication model.

## Reasoning

- This matches the primary self-hosted single-user scenario.
- It avoids premature complexity around session cookies, CSRF, and account flows.
- It is good enough to validate product value before investing in broader auth support.
