import { readFileSync, writeFileSync } from 'node:fs';

export interface TaglifyResult {
  text: string;
  changed: boolean;
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Maps marker open string -> close string, e.g. `{ '<!-- ': ' -->' }`.
export type CommentStyle = Record<string, string>;

const DEFAULT_COMMENT_STYLE: CommentStyle = { '<!-- ': ' -->' };

export interface TaglifyOptions {
  /**
   * Marker open/close pairs to recognize, e.g. `{ '#': '', '/* ': ' *\/' }`.
   * Defaults to HTML comments (`<!-- TAG:START -->`) only, since other
   * styles (`#`, `//`) risk false-positive matches on non-comment content.
   */
  commentStyle?: CommentStyle;
}

/**
 * Replaces content between marker comments.
 *
 * Example:
 * <!-- BADGES:START -->
 * old content
 * <!-- BADGES:END -->
 */
export const taglifyText = (
  text: string,
  tags: Record<string, string>,
  options?: TaglifyOptions,
): TaglifyResult => {
  const commentStyle = options?.commentStyle ?? DEFAULT_COMMENT_STYLE;
  let output = text;

  for (const [tagName, replacement] of Object.entries(tags)) {
    const tag = escapeRegExp(tagName.toUpperCase());

    for (const [prefix, suffix] of Object.entries(commentStyle)) {
      const start = `${escapeRegExp(prefix)}${tag}:START${escapeRegExp(suffix)}`;
      const end = `${escapeRegExp(prefix)}${tag}:END${escapeRegExp(suffix)}`;
      const blockRegex = new RegExp(`${start}(.*?)${end}`, 'gis');

      output = output.replace(blockRegex, (_match, block: string) => {
        const lineEnding = block.includes('\r\n') ? '\r\n' : '\n';
        return `${prefix}${tag}:START${suffix}${lineEnding}${replacement}${lineEnding}${prefix}${tag}:END${suffix}`;
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
export const taglifyFile = (
  filePath: string,
  tags: Record<string, string>,
  options?: TaglifyOptions,
): boolean => {
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
