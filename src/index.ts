import { readFileSync, writeFileSync } from 'node:fs';

export interface TaglifyResult {
  text: string;
  changed: boolean;
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Marker wrappers tried for every tag, in order. First one to match a block wins for that block.
const COMMENT_STYLES: ReadonlyArray<{ prefix: string; suffix: string }> = [
  { prefix: '<!-- ', suffix: ' -->' },
  { prefix: '/* ', suffix: ' */' },
  { prefix: '// ', suffix: '' },
  { prefix: '# ', suffix: '' },
];

/**
 * Replaces content between marker comments.
 *
 * Example:
 * <!-- BADGES:START -->
 * old content
 * <!-- BADGES:END -->
 *
 * Also supports `/* *\/`, `//`, and `#` comment markers.
 */
export const taglifyText = (text: string, tags: Record<string, string>): TaglifyResult => {
  let output = text;

  for (const [tagName, replacement] of Object.entries(tags)) {
    const tag = escapeRegExp(tagName.toUpperCase());

    for (const { prefix, suffix } of COMMENT_STYLES) {
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
export const taglifyFile = (filePath: string, tags: Record<string, string>): boolean => {
  let text: string;
  try {
    text = readFileSync(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }

  const result = taglifyText(text, tags);

  if (result.changed) {
    writeFileSync(filePath, result.text, 'utf8');
  }

  return result.changed;
};
