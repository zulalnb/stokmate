# StokMate — Repo Guide

This repo has two independent projects, plus a mobile app in progress:

- `web/` — React/Vite frontend. Has its own `AGENTS.md` with project rules.
- `api/` — .NET backend.
- `mobile/` — mobile app (in progress).

## Ask web or mobile before starting a task

Before starting any task, ask the user whether it targets `web/` or `mobile/` — do not guess from wording alone. Skip the question only if the user already specified it, or it's unambiguous from context (e.g. they reference a file already inside one of the two folders).

Once the target is known, scope work to that project only:

- Task is for `web/` — do not read, browse or analyze files inside `mobile/`.
- Task is for `mobile/` — do not read, browse or analyze files inside `web/`.

## Shared working rules

- Preserve existing behavior unless the task explicitly changes it.
- Do not expand the scope of the requested work or touch unrelated files.
- Do not add dependencies without user approval.
- Do not implement speculative features or abstractions.
- If API behavior is unknown, read `api/API.md`; do not make assumptions.
- If terminology or requirements are unclear or contradictory, ask the user instead of making a product decision.
- Do not weaken client-side security rules.
- If project documentation conflicts, report it rather than silently choosing one.
- User-facing text is Turkish; code and commit messages are English.
- Do not leave `console.log` statements.

## Do not explore `api/`

Agents must not read, browse or analyze files inside `api/`. Work stays scoped to `web/` or `mobile/` unless explicitly told otherwise.

The only exception is `api/API.md`, the documented endpoint reference — read that specific file when frontend work needs to check API behavior, instead of browsing the rest of `api/`.
