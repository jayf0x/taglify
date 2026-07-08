import { readFileSync, writeFileSync } from 'node:fs';

export interface TaglifyResult {
  text: string;
  changed: boolean;
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Replaces content between HTML comment markers.
 *
 * Example:
 * <!-- BADGES:START -->
 * old content
 * <!-- BADGES:END -->
 */
export const taglifyText = (text: string, tags: Record<string, string>): TaglifyResult => {
  let output = text;

  for (const [tagName, replacement] of Object.entries(tags)) {
    const tag = escapeRegExp(tagName.toUpperCase());
    const blockRegex = new RegExp(`<!-- ${tag}:START -->(.*?)<!-- ${tag}:END -->`, 'gis');

    output = output.replace(blockRegex, (_match, block: string) => {
      const lineEnding = block.includes('\r\n') ? '\r\n' : '\n';
      return `<!-- ${tag}:START -->${lineEnding}${replacement}${lineEnding}<!-- ${tag}:END -->`;
    });
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
