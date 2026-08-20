# StokMate — Repo Guide

This repo has two independent projects:

- `web/` — React/Vite frontend. Has its own `AGENTS.md` with project rules.
- `api/` — .NET backend.

## Do not explore `api/`

Agents must not read, browse or analyze files inside `api/`. Work stays
scoped to `web/` unless explicitly told otherwise.

The only exception is `api/API.md`, the documented endpoint reference — read
that specific file when frontend work needs to check API behavior, instead
of browsing the rest of `api/`.
