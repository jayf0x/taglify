# Taglify — keep generated content in sync, everywhere

[![npm version](https://img.shields.io/npm/v/taglify)](https://www.npmjs.com/package/taglify)
[![license](https://img.shields.io/npm/l/taglify)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](./tsconfig.json)
[![CI](https://github.com/jayf0x/taglify/actions/workflows/ci.yml/badge.svg)](https://github.com/jayf0x/taglify/actions/workflows/ci.yml)

![Preview](./assets/preview.png)


> ⭐ **Star [this repository](https://github.com/jayf0x/taglify) if you’d like to support its growth**


Ever felt the friction of writing a one-off regex just to keep a badge, a
table, or a live stat up to date in a file?

I was writing bash functions to have my e2e tests output live stats in the
README of [compress-shader-literals](https://github.com/jayf0x/compress-shader-literals).
Then I started reaching for the same trick in other tools, so I pulled it
out into its own package. Now I'm shipping it — enjoy 🤗

Drop a marker in any text file, point a script at it, done:

```html
<!-- BADGES:START -->
old content
<!-- BADGES:END -->
```

Taglify replaces everything between a matching pair of markers and leaves
the rest of the file exactly as it is. It's not a template engine — no
logic, no loops, no partials. Just a precise, predictable swap.

## Installation

```bash
bun add taglify
# OR npm / pnpm / yarn ...
```

## Quickstart

```ts
import { taglifyFile } from 'taglify';

taglifyFile('./README.md', { VERSION: getNewVersion(), BADGES: allBadges() });
```

That's it — `taglifyFile` reads the file, swaps the content inside each
matching marker, and writes back only if something actually changed.

---

## Automate it

Taglify does nothing on its own — it's a building block for a script you
already run. The common pattern is to call it right before a release, e.g.
in your version bump script or a `prepublishOnly` hook:

```ts
// scripts/sync-readme.ts — run before every release
import { taglifyFile } from 'taglify';
import { version } from '../package.json';

taglifyFile('./README.md', {
  VERSION: version,
  BADGES: renderBadges(),
});
```

```json
// package.json
{
  "scripts": {
    "prepublishOnly": "bun run scripts/sync-readme.ts"
  }
}
```

Same idea works in a CI step, a git pre-commit hook, or a cron job — Taglify
just needs to be called; when and how is up to you.

---

## API

### `taglifyText(text, tags)`

| Param  | Type                     | Description                    |
| ------ | ------------------------ | ------------------------------ |
| `text` | `string`                 | Source text                    |
| `tags` | `Record<string, string>` | Tag name → replacement content |

Returns `{ text: string, changed: boolean }`.

### `taglifyFile(filePath, tags)`

Reads `filePath`, applies `taglifyText`, and writes back only if the content
changed.

- Returns `boolean` — whether the file was modified.
- Throws a friendly error (`File not found: <path>`) if the file doesn't
  exist.

---

## Marker format

```html
<!-- TAG:START -->
content
<!-- TAG:END -->
```

| Rule                          | Behavior                                  |
| ------------------------------ | ----------------------------------------- |
| Tag name casing                | Case-insensitive, normalized to uppercase |
| Content between markers        | Fully replaced                            |
| Markers themselves             | Always preserved                          |
| Multiple blocks, same tag      | All replaced                              |
| Tag with no matching block     | Skipped                                   |
| Replacement value type         | `string` only                             |

---

## Roadmap

Taglify is a small, deliberately minimal util today. These are ideas for
where it could go — see [BACKLOG.md](./BACKLOG.md) for the full list.

- [ ] Configurable marker syntax and comment styles (`//`, `#`, `/* */`)
- [ ] Create missing blocks instead of skipping
- [ ] CLI with dry-run and diff output
- [ ] Glob / directory processing
- [ ] Support non-string values, serialized as formatted JSON

## Contributing

See [AGENTS.md](./AGENTS.md) for conventions when working on this repo.

## License

MIT
