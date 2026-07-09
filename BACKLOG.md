# Backlog

Ideas for future work beyond the POC. Nothing here is scheduled.

## Configurable marker syntax
Start: marker format is hardcoded as `<!-- TAG:START -->` / `<!-- TAG:END -->` in `taglifyText`. Let callers pass a custom prefix/suffix template. Stop: don't add a full templating language, just prefix/suffix strings.

## Custom delimiters per call
Start: allow the `:START`/`:END` suffixes to be overridden per `taglifyText`/`taglifyFile` call instead of being fixed constants. Stop: per-call override only, no global config system.

## Create missing blocks instead of skipping
Start: when a tag has no matching block in the file, currently nothing happens. Add an option to insert a new block (e.g. at EOF) instead of silently skipping. Stop: simple append behavior; no smart placement logic.

## Preserve surrounding indentation of the block
Start: replacement content is inserted without regard to the indentation of the `START` marker line. Detect and reapply that indentation to inserted lines. Stop: single-level indent matching, not a full reformatter.

## Built-in formatting helpers
Start: ship small helper functions for common replacement shapes (tables, lists, badges) that callers can use to build the `replacement` string. Stop: a handful of helpers, not a templating/markdown-generation library.

## CLI for running taglify against files/globs
Start: add a `bin` entry that wraps `taglifyFile`/`taglifyText` for shell use, taking a file/glob and tag values. Stop: thin wrapper over the existing API, no new core logic.

## Dry-run mode
Start: add an option to `taglifyFile` that computes the result without calling `writeFileSync`, returning what would change. Stop: reuse `taglifyText`'s existing diff between input/output.

## Diff output for changed blocks
Start: when a block changes, expose a before/after diff (e.g. unified diff string) alongside the boolean `changed` result. Stop: diff of changed blocks only, not whole-file diffing.

## Async API (`taglifyFileAsync`)
Start: add an async counterpart to `taglifyFile` using `fs/promises` (`readFile`/`writeFile`) for non-blocking I/O. Stop: mirror the sync API's behavior exactly, no new options.

## Glob support for matching multiple files
Start: accept a glob pattern in place of a single file path and run `taglifyFile` against each match. Stop: single-level glob expansion, not directory walking (see next item).

## Directory/recursive processing
Start: accept a directory path and recursively process matching files within it. Stop: recursion only, filtering rules belong to "Ignore rules" below.

## Ignore rules
Start: support a `.taglifyignore` file (or option) to exclude paths from directory/glob processing. Stop: gitignore-style patterns only, no plugin hooks for custom exclusion logic.

## Support non-string values
Start: `tags` is typed `Record<string, string>`; allow objects/numbers as values, serialized as formatted JSON in the block. Stop: JSON.stringify-based default formatting, not user-defined formats (see next item).

## Custom serializers for non-string values
Start: let callers supply a function to control how a non-string tag value is turned into block text, overriding the default JSON formatting above. Stop: one serializer function per tag/call, no serializer registry.

## Replace callbacks
Start: allow a `tags` value to be a function `(currentBlockContent: string) => string` instead of a static string, so replacement can depend on existing content. Stop: sync callback only; async callbacks belong to "Async API" above.

## Stronger typing for tag values and options
Start: tighten `TaglifyResult`/`tags`/options types once the above features (non-string values, callbacks) land, so the public API stays type-safe. Stop: type-level work only, no behavior change.

## Better error handling and error messages
Start: today only missing-file (`ENOENT`) has a friendly message; other errors (bad regex from tag names, unreadable files, malformed markers) pass through raw. Add clear messages for these cases. Stop: message clarity, not a new error-class hierarchy.

## Performance improvements for large files
Start: `taglifyText` runs one regex pass per tag over the whole file; for many tags/large files, benchmark and consider a single combined pass. Stop: only pursue if a benchmark shows a real bottleneck.

## Plugin/hooks system
Start: add extension points (e.g. before/after replace) so behavior can be customized without forking `taglifyText`. Stop: minimal hook list driven by concrete use cases above, not a generic plugin framework.
