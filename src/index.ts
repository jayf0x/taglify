import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export interface TaglifyResult {
  text: string;
  changed: boolean;
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
  /** When true, taglifyFile throws on errors instead of logging and returning false. Default false. */
  throwOnError?: boolean;
}

const DEFAULT_COMMENT_STYLE: CommentStyle = { '<!-- ': ' -->' };

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
  let output = text;

  for (const [tagName, replacement] of Object.entries(tags)) {
    const tag = escapeRegExp(tagName.toUpperCase());

    for (const { prefix, suffix, escPrefix, escSuffix } of escapedStyles) {
      const reStart = `${escPrefix}${tag}:START${escSuffix}`;
      const reEnd = `${escPrefix}${tag}:END${escSuffix}`;

      const blockRegex = new RegExp(`${reStart}(.*?)${reEnd}`, 'gis');

      output = output.replace(blockRegex, (_match, block: string) => {
        const lEnd = block.includes('\r\n') ? '\r\n' : '\n';
        const start = `${prefix}${tag}:START${suffix}`;
        const end = `${prefix}${tag}:END${suffix}`;

        return `${start}${lEnd}${replacement}${lEnd}${end}`;
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

  try {
    const text = readFileSync(filePath, 'utf8');
    const result = taglifyText(text, tags, options);
    result.write(filePath);
    return result.changed;
  } catch (error) {
    return handleError(error, options);
  }
};
