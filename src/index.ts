import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export type TaglifyValue = string | unknown;

export interface TaglifyResult {
  text: string;
  changed: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stringifyValue(value: TaglifyValue): string {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

/**
 * Replaces content between HTML comment markers.
 *
 * Example:
 * <!-- BADGES:START -->
 * old content
 * <!-- BADGES:END -->
 */
export function taglifyText(
  text: string,
  tags: Record<string, TaglifyValue>,
): TaglifyResult {
  let output = text;

  for (const [tagName, value] of Object.entries(tags)) {
    const tag = escapeRegExp(tagName.toUpperCase());
    const blockRegex = new RegExp(
      `(<!-- ${tag}:START -->)([\\s\\S]*?)(<!-- ${tag}:END -->)`,
      'gi',
    );

    const replacement = stringifyValue(value);
    output = output.replace(blockRegex, (_match, _start, block: string) => {
      const lineEnding = block.includes('\r\n') ? '\r\n' : '\n';
      return `<!-- ${tag}:START -->${lineEnding}${replacement}${lineEnding}<!-- ${tag}:END -->`;
    });
  }

  return {
    text: output,
    changed: output !== text,
  };
}

/**
 * Applies tag replacements to a file.
 *
 * Returns true if the file was modified.
 * Throws if the file does not exist.
 */
export function taglifyFile(
  filePath: string,
  tags: Record<string, TaglifyValue>,
): boolean {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const text = readFileSync(filePath, 'utf8');
  const result = taglifyText(text, tags);

  if (result.changed) {
    writeFileSync(filePath, result.text, 'utf8');
  }

  return result.changed;
}
