# Taglify — keep generated content in sync, everywhere

<!-- SHIELDS:START -->

[![npm version](https://img.shields.io/npm/v/taglify)](https://www.npmjs.com/package/taglify)
[![license](https://img.shields.io/npm/l/taglify)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](./tsconfig.json)
[![CI](https://github.com/jayF0x/taglify/actions/workflows/ci.yml/badge.svg)](https://github.com/jayF0x/taglify/actions/workflows/ci.yml)
<!-- SHIELDS:END -->

<!-- PREVIEW:START -->

![Preview](./assets/preview.png)
<!-- PREVIEW:END -->

<!-- STARGAZE:START -->

> ⭐ **Star this [repository](https://github.com/jayF0x/taglify) if you'd like to support its growth**

<!-- STARGAZE:END -->

I was writing custom functions to have live stats in the README of [compress-shader-literals](https://github.com/jayf0x/compress-shader-literals).
Centralized the logic into a simple reusable function, now sharing the result 🤗

<!-- INSTALL:START -->

## Installation

```bash
bun add taglify
```

<!-- INSTALL:END -->

## Example

Add this to your readme:

```md
<!-- STATS:START -->
<!-- STATS:END -->
```

In your build flow:

```js
import { taglifyFile } from 'taglify';

const coverageSummary = '...';
taglifyFile('./README.md', { STATS: coverageSummary });
```

**after**:

```md
<!-- STATS:START -->

| Browser | Passed | Failed |
| ------- | ------ | ------ |
| Brave   | 127    | 0      |
| Firefox | 127    | 0      |
| Edge    | 0      | 127    |

<!-- STATS:END -->
```

---

Same idea works for any file type, in a CI step, a git pre-commit hook, or a cron job.

## API

### `taglifyText(text, tags, options?)`

| Param     | Type                     | Description                    |
| --------- | ------------------------ | ------------------------------ |
| `text`    | `string`                 | Source text                    |
| `tags`    | `Record<string, string>` | Tag name → replacement content |
| `options` | `TaglifyOptions`         | See below                      |

Returns `{ text: string, changed: boolean, diffs: BlockDiff[], write: (filePath: string) => void }`.
`write` writes `text` to `filePath`, but only if `changed` — so you can call
`taglifyText(...).write('./README.md')` without importing `fs` yourself.
`diffs` lists `{ tag, before, after }` for each block that changed.

### `taglifyFile(filePath, tags, options?)`

Reads `filePath`, applies `taglifyText`, and writes back only if the content
changed. Internally it's just `taglifyText(...).write(filePath)`.

- Returns `boolean` — whether the file was modified.
- On error (missing file, unreadable file, write failure), logs a clear
  message (with the underlying error as `cause`) via `console.error` and
  returns `false`. Pass `{ throwOnError: true }` to throw instead.

### `TaglifyOptions`

| Option         | Type                  | Default               | Description                                                |
| -------------- | --------------------- | --------------------- | ---------------------------------------------------------- |
| `commentStyle` | `Record<open, close>` | `{ '<!-- ': ' -->' }` | Marker open/close pairs to recognize                       |
| `startSuffix`  | `string`              | `'START'`             | Suffix marking the start of a block, e.g. `TAG:START`      |
| `endSuffix`    | `string`              | `'END'`               | Suffix marking the end of a block, e.g. `TAG:END`          |
| `throwOnError` | `boolean`             | `false`               | `taglifyFile` throws on error instead of logging + `false` |

`commentStyle` replaces the default entirely — pass every style you want
matched. Multiple entries are all tried, so different blocks in the same
file can use different styles:

```js
taglifyText(text, tags, {
  commentStyle: { '// ': '', '# ': '', '/* ': ' */' },
});
```

Only HTML comments are matched by default because `#` and `//` are common
in ordinary content (markdown headings, URLs) and risk false-positive
matches — opt in explicitly for those.

---

## Marker format

```html
<!-- TAG:START -->
content
<!-- TAG:END -->
```

| Rule                       | Behavior                                  |
| -------------------------- | ----------------------------------------- |
| Tag name casing            | Case-insensitive, normalized to uppercase |
| Content between markers    | Fully replaced                            |
| Markers themselves         | Always preserved                          |
| Multiple blocks, same tag  | All replaced                              |
| Tag with no matching block | Skipped                                   |
| Replacement value type     | `string` only                             |

---

## Roadmap

Taglify is a small, deliberately minimal util today. These are ideas for
where it could go — see [BACKLOG.md](./BACKLOG.md) for the full list.

<!-- ROADMAP:START -->

- [ ] Create missing blocks instead of skipping.
- [ ] Preserve surrounding indentation of the block.
- [ ] Built-in formatting helpers.
- [ ] CLI for running taglify against files/globs.
- [ ] Async API (`taglifyFileAsync`).

<!-- ROADMAP:END -->

## License

[MIT](./LICENSE) © [jayF0x](https://github.com/jayf0x)
