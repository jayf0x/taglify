# Taglify — keep generated content in sync, everywhere

[![npm version](https://img.shields.io/npm/v/taglify)](https://www.npmjs.com/package/taglify)
[![license](https://img.shields.io/npm/l/taglify)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](./tsconfig.json)
[![CI](https://github.com/jayf0x/taglify/actions/workflows/ci.yml/badge.svg)](https://github.com/jayf0x/taglify/actions/workflows/ci.yml)

![Preview](./assets/preview.png)

> ⭐ **Star this [repository](https://github.com/jayf0x/taglify) if you’d like to support its growth.**

I was writing bash functions to have my e2e tests output live stats in the
README of [compress-shader-literals](https://github.com/jayf0x/compress-shader-literals).
Then made this into a function and now sharing the results 🤗

## Installation

```bash
bun add taglify
```

## Example

Your README.md **before**:

```md
<!-- STATS:START -->
<!-- STATS:END -->
```

Somewhere:

```js
import { taglifyFile } from 'taglify';

const coverageSummary = '...';
taglifyFile('./README.md', { STATS: coverageSummary });
```

Your README.md **after**:

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

Returns `{ text: string, changed: boolean }`.

### `taglifyFile(filePath, tags, options?)`

Reads `filePath`, applies `taglifyText`, and writes back only if the content
changed.

- Returns `boolean` — whether the file was modified.
- Throws a friendly error (`File not found: <path>`) if the file doesn't
  exist.

### `TaglifyOptions`

| Option         | Type                  | Default               | Description                          |
| -------------- | --------------------- | --------------------- | ------------------------------------ |
| `commentStyle` | `Record<open, close>` | `{ '<!-- ': ' -->' }` | Marker open/close pairs to recognize |

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

- [ ] Custom delimiters per call (`:START`/`:END` overrides)
- [ ] Create missing blocks instead of skipping
- [ ] CLI with dry-run and diff output
- [ ] Glob / directory processing
- [ ] Support non-string values, serialized as formatted JSON

## License

[MIT](./LICENSE) © [jayF0x](https://github.com/jayf0x)
