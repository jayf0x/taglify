# AGENTS.md

Guidance for AI coding agents working in this repo.

## Runtime

Use Bun, not Node:

- `bun <file>` instead of `node`/`ts-node`
- `bun test` instead of `jest`/`vitest`
- `bun install` instead of `npm`/`yarn`/`pnpm`

## What this project is

Taglify replaces content between `<!-- TAG:START -->` / `<!-- TAG:END -->`
HTML comment markers in text files. It is not a template engine — see
[README.md](./README.md) for the full spec and [BACKLOG.md](./BACKLOG.md)
for out-of-scope future work.

## Conventions

- All public API lives in [src/index.ts](./src/index.ts): `taglifyText` and
  `taglifyFile`. Keep it small — no config objects, no CLI, no async API
  unless explicitly requested.
- Tag values are `string` only. Do not reintroduce object/JSON stringification
  without an explicit request (it was deliberately cut from scope).
- Tests live in [tests/index.test.ts](./tests/index.test.ts) using
  `bun:test`. Run with `bun test`.
- Typecheck with `bun run typecheck` before considering a change done.
- Keep functions small and avoid speculative abstractions — this is a
  minimal POC intended to stay minimal.
- The README's "Roadmap" section is a curated, checkbox subset of
  [BACKLOG.md](./BACKLOG.md). When an item ships, check it off in the README
  and remove it from BACKLOG.md; when adding a backlog item worth
  surfacing, add it to both.
