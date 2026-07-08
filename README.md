# Taglify

Synchronize generated content inside marker blocks in any text file.

Taglify is not a template engine. It only replaces the content between a
matching pair of start/end markers, leaving the rest of the file untouched.
Useful for keeping generated snippets (badges, tables, changelogs, docs) in
sync with a script instead of hand-editing them.

## Installation

```bash
bun install taglify
```

## Basic usage

```ts
import { taglifyFile, taglifyText } from 'taglify';

const { text, changed } = taglifyText(
  '<!-- BADGES:START -->old<!-- BADGES:END -->',
  { BADGES: 'new' },
);
// text: "<!-- BADGES:START -->\nnew\n<!-- BADGES:END -->"

const wasModified = taglifyFile('./README.md', { BADGES: 'new' });
```

## API

### `taglifyText(text, tags)`

- `text: string` — the source text.
- `tags: Record<string, unknown>` — tag name to replacement content.
- Returns `{ text: string, changed: boolean }`.

### `taglifyFile(filePath, tags)`

- Reads `filePath`, applies `taglifyText`, and writes back only if the
  content changed.
- Returns `boolean` — whether the file was modified.
- Throws if the file does not exist.

## Marker format

```html
<!-- TAG:START -->
content
<!-- TAG:END -->
```

- Tag names are case-insensitive and normalized to uppercase in the output.
- Everything between `START` and `END` is replaced; the markers themselves
  are preserved.
- All matching blocks for a tag are replaced.
- Tags with no matching block in the text are skipped.
- Non-string values are stringified as formatted (indented) JSON.

## Supported behavior

- Any text file.
- HTML comment markers only (`<!-- TAG:START -->` / `<!-- TAG:END -->`).
- Synchronous file API.

## Limitations

- No custom marker syntax or comment styles (`//`, `#`, `/* */`).
- No inline markers.
- Missing blocks are not created.
- No CLI, diff output, or async API.
- No configuration options.

See [BACKLOG.md](./BACKLOG.md) for planned future work.

## License

MIT
