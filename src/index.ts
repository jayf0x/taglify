import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export interface BlockDiff {
  tag: string;
  before: string;
  after: string;
}

export interface TaglifyResult {
  text: string;
  changed: boolean;
  /** Before/after content of each block that changed. */
  diffs: BlockDiff[];
  /** Writes `text` to `filePath` if `changed`; no-ops otherwise. */
  write: (filePath: string) => void;
}

// Maps marker open string -> close string, e.g. `{ '<!-- ': ' -->' }`.
export type CommentStyle = Record<string, string>;

export interface TaglifyOptions {
  /**
   * Marker open/close pairs to recognize, e.g. `{ '#': '', '/* ': ' *\/' }`.
   * Defaults to HTML comments (`<!-- TAG:START -->`) only, since other
   * styles (`#`, `//`) risk false-positive matches on non-comment content.
   */
  commentStyle?: CommentStyle;
  /** Suffix marking the start of a block, e.g. `TAG:START`. Default 'START'. */
  startSuffix?: string;
  /** Suffix marking the end of a block, e.g. `TAG:END`. Default 'END'. */
  endSuffix?: string;
  /** When true, taglifyFile throws on errors instead of logging and returning false. Default false. */
  throwOnError?: boolean;
}

const DEFAULT_COMMENT_STYLE: CommentStyle = { '<!-- ': ' -->' };
const DEFAULT_START_SUFFIX = 'START';
const DEFAULT_END_SUFFIX = 'END';

const REGEXP_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

const escapeRegExp = (value: string): string => value.replace(REGEXP_SPECIAL_CHARS, '\\$&');

/**
 * Replaces content between marker comments.
 *
 * Example:
 * <!-- BADGES:START -->
 * old content
 * <!-- BADGES:END -->
 */
export const taglifyText = (text: string, tags: Record<string, string>, options?: TaglifyOptions): TaglifyResult => {
  const escapedStyles = Object.entries(options?.commentStyle ?? DEFAULT_COMMENT_STYLE).map(([prefix, suffix]) => ({
    prefix,
    suffix,
    escPrefix: escapeRegExp(prefix),
    escSuffix: escapeRegExp(suffix),
  }));
  const startSuffix = options?.startSuffix ?? DEFAULT_START_SUFFIX;
  const endSuffix = options?.endSuffix ?? DEFAULT_END_SUFFIX;
  let output = text;
  const diffs: BlockDiff[] = [];

  for (const [tagName, replacement] of Object.entries(tags)) {
    const tag = escapeRegExp(tagName.toUpperCase());

    for (const { prefix, suffix, escPrefix, escSuffix } of escapedStyles) {
      const reStart = `${escPrefix}${tag}:${startSuffix}${escSuffix}`;
      const reEnd = `${escPrefix}${tag}:${endSuffix}${escSuffix}`;

      const blockRegex = new RegExp(`${reStart}(.*?)${reEnd}`, 'gis');

      output = output.replace(blockRegex, (_match, block: string) => {
        const lEnd = block.includes('\r\n') ? '\r\n' : '\n';
        const start = `${prefix}${tag}:${startSuffix}${suffix}`;
        const end = `${prefix}${tag}:${endSuffix}${suffix}`;
        const after = `${start}${lEnd}${replacement}${lEnd}${end}`;

        if (after !== _match) diffs.push({ tag: tagName, before: _match, after });

        return after;
      });
    }
  }

  const changed = output !== text;
  const write = (filePath: string): void => {
    if (changed) writeFileSync(filePath, output, 'utf8');
  };

  return {
    text: output,
    changed,
    diffs,
    write,
  };
};

const handleError = (error: unknown, options?: TaglifyOptions): false => {
  if (options?.throwOnError) throw error;
  console.error(error);
  return false;
};

/**
 * Applies tag replacements to a file, writing back only if content changed.
 *
 * Returns true if the file was modified, false on any error (missing file,
 * read/write failure). Pass `{ throwOnError: true }` to throw instead.
 */
export const taglifyFile = (filePath: string, tags: Record<string, string>, options?: TaglifyOptions): boolean => {
  if (!existsSync(filePath)) {
    return handleError(new Error(`File not found: ${filePath}`), options);
  }

  let text: string;
  try {
    text = readFileSync(filePath, 'utf8');
  } catch (error) {
    return handleError(new Error(`Failed to read file: ${filePath}`, { cause: error }), options);
  }

  const result = taglifyText(text, tags, options);

  try {
    result.write(filePath);
  } catch (error) {
    return handleError(new Error(`Failed to write file: ${filePath}`, { cause: error }), options);
  }

  return result.changed;
};
