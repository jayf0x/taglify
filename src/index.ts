import { readFileSync, writeFileSync } from 'node:fs';

export interface TaglifyResult {
  text: string;
  changed: boolean;
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

  return {
    text: output,
    changed: output !== text,
  };
};

/**
 * Applies tag replacements to a file.
 *
 * Returns true if the file was modified.
 * Throws a friendly error if the file does not exist.
 */
export const taglifyFile = (filePath: string, tags: Record<string, string>, options?: TaglifyOptions): boolean => {
  let text: string;
  try {
    text = readFileSync(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }

  const result = taglifyText(text, tags, options);

  if (result.changed) {
    writeFileSync(filePath, result.text, 'utf8');
  }

  return result.changed;
};
