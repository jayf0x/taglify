import { afterEach, expect, spyOn, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { taglifyFile, taglifyFileAsync, taglifyText } from '../src/index';

test('replaces a single tag', () => {
  const text = '<!-- BADGES:START -->old<!-- BADGES:END -->';
  const result = taglifyText(text, { BADGES: 'new' });

  expect(result.changed).toBe(true);
  expect(result.text).toBe('<!-- BADGES:START -->\nnew\n<!-- BADGES:END -->');
});

test('replaces multiple tags', () => {
  const text = '<!-- A:START -->x<!-- A:END -->\n<!-- B:START -->y<!-- B:END -->';
  const result = taglifyText(text, { A: '1', B: '2' });

  expect(result.text).toContain('<!-- A:START -->\n1\n<!-- A:END -->');
  expect(result.text).toContain('<!-- B:START -->\n2\n<!-- B:END -->');
});

test('leaves text unchanged when tag is missing', () => {
  const text = '<!-- BADGES:START -->old<!-- BADGES:END -->';
  const result = taglifyText(text, { OTHER: 'new' });

  expect(result.changed).toBe(false);
  expect(result.text).toBe(text);
});

test('replaces multiple occurrences of the same tag', () => {
  const text = '<!-- TAG:START -->a<!-- TAG:END -->\n<!-- TAG:START -->b<!-- TAG:END -->';
  const result = taglifyText(text, { TAG: 'x' });

  const matches = result.text.match(/x/g);
  expect(matches?.length).toBe(2);
});

test('tag names are case-insensitive', () => {
  const text = '<!-- badges:START -->old<!-- BADGES:end -->';
  const result = taglifyText(text, { Badges: 'new' });

  expect(result.text).toBe('<!-- BADGES:START -->\nnew\n<!-- BADGES:END -->');
});

test('does not match "#"-style markers by default', () => {
  const text = '# BADGES:START\nold\n# BADGES:END';
  const result = taglifyText(text, { BADGES: 'new' });

  expect(result.changed).toBe(false);
});

test('replaces block-comment style markers via commentStyle option', () => {
  const text = '/* BADGES:START */old/* BADGES:END */';
  const result = taglifyText(text, { BADGES: 'new' }, { commentStyle: { '/* ': ' */' } });

  expect(result.changed).toBe(true);
  expect(result.text).toBe('/* BADGES:START */\nnew\n/* BADGES:END */');
});

test('replaces slash-comment style markers via commentStyle option', () => {
  const text = '// BADGES:START\nold\n// BADGES:END';
  const result = taglifyText(text, { BADGES: 'new' }, { commentStyle: { '// ': '' } });

  expect(result.text).toBe('// BADGES:START\nnew\n// BADGES:END');
});

test('replaces hash-comment style markers via commentStyle option', () => {
  const text = '# BADGES:START\nold\n# BADGES:END';
  const result = taglifyText(text, { BADGES: 'new' }, { commentStyle: { '# ': '' } });

  expect(result.text).toBe('# BADGES:START\nnew\n# BADGES:END');
});

test('commentStyle with multiple entries matches each style in the same file', () => {
  const text = '// A:START\nx\n// A:END\n# B:START\ny\n# B:END';
  const result = taglifyText(text, { A: '1', B: '2' }, { commentStyle: { '// ': '', '# ': '' } });

  expect(result.text).toContain('// A:START\n1\n// A:END');
  expect(result.text).toContain('# B:START\n2\n# B:END');
});

test('setting commentStyle replaces the default HTML-comment style entirely', () => {
  const text = '<!-- BADGES:START -->old<!-- BADGES:END -->';
  const result = taglifyText(text, { BADGES: 'new' }, { commentStyle: { '# ': '' } });

  expect(result.changed).toBe(false);
});

test('custom startSuffix/endSuffix override the default markers', () => {
  const text = '<!-- BADGES:OPEN -->old<!-- BADGES:CLOSE -->';
  const result = taglifyText(text, { BADGES: 'new' }, { startSuffix: 'OPEN', endSuffix: 'CLOSE' });

  expect(result.changed).toBe(true);
  expect(result.text).toBe('<!-- BADGES:OPEN -->\nnew\n<!-- BADGES:CLOSE -->');
});

test('does not match default START/END markers when custom suffixes are set', () => {
  const text = '<!-- BADGES:START -->old<!-- BADGES:END -->';
  const result = taglifyText(text, { BADGES: 'new' }, { startSuffix: 'OPEN', endSuffix: 'CLOSE' });

  expect(result.changed).toBe(false);
});

test('diffs lists before/after content for each changed block', () => {
  const text = '<!-- A:START -->x<!-- A:END -->\n<!-- B:START -->\ny\n<!-- B:END -->';
  const result = taglifyText(text, { A: '1', B: 'y' });

  expect(result.diffs).toEqual([
    { tag: 'A', before: '<!-- A:START -->x<!-- A:END -->', after: '<!-- A:START -->\n1\n<!-- A:END -->' },
  ]);
});

test('diffs is empty when nothing changes', () => {
  const text = '<!-- BADGES:START -->old<!-- BADGES:END -->';
  const result = taglifyText(text, { OTHER: 'new' });

  expect(result.diffs).toEqual([]);
});

test('preserves indentation of the START marker', () => {
  const text = '  <!-- TAG:START -->\n  old\n  <!-- TAG:END -->';
  const result = taglifyText(text, { TAG: 'line1\nline2' });

  expect(result.text).toBe('  <!-- TAG:START -->\n  line1\n  line2\n  <!-- TAG:END -->');
});

let tempDir: string;

afterEach(() => {
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
});

test('taglifyFile writes only when content changed', () => {
  tempDir = mkdtempSync(join(tmpdir(), 'taglify-'));
  const filePath = join(tempDir, 'file.md');
  writeFileSync(filePath, '<!-- TAG:START -->old<!-- TAG:END -->', 'utf8');

  const changed = taglifyFile(filePath, { TAG: 'new' });
  expect(changed).toBe(true);
  expect(readFileSync(filePath, 'utf8')).toBe('<!-- TAG:START -->\nnew\n<!-- TAG:END -->');

  const unchanged = taglifyFile(filePath, { OTHER: 'value' });
  expect(unchanged).toBe(false);
});

test('taglifyFile logs and returns false when file does not exist', () => {
  const errorSpy = spyOn(console, 'error').mockImplementation(() => {});

  const result = taglifyFile('/nonexistent/path.md', {});

  expect(result).toBe(false);
  expect(errorSpy).toHaveBeenCalled();
  errorSpy.mockRestore();
});

test('taglifyFile throws when file does not exist and throwOnError is set', () => {
  expect(() => taglifyFile('/nonexistent/path.md', {}, { throwOnError: true })).toThrow(
    'File not found: /nonexistent/path.md'
  );
});

test('taglifyFileAsync writes only when content changed', async () => {
  tempDir = mkdtempSync(join(tmpdir(), 'taglify-'));
  const filePath = join(tempDir, 'file.md');
  writeFileSync(filePath, '<!-- TAG:START -->old<!-- TAG:END -->', 'utf8');

  const changed = await taglifyFileAsync(filePath, { TAG: 'new' });
  expect(changed).toBe(true);
  expect(readFileSync(filePath, 'utf8')).toBe('<!-- TAG:START -->\nnew\n<!-- TAG:END -->');

  const unchanged = await taglifyFileAsync(filePath, { OTHER: 'value' });
  expect(unchanged).toBe(false);
});

test('taglifyFileAsync throws when file does not exist and throwOnError is set', async () => {
  await expect(taglifyFileAsync('/nonexistent/path.md', {}, { throwOnError: true })).rejects.toThrow(
    'File not found: /nonexistent/path.md'
  );
});

test('taglifyText result.write only writes when changed', () => {
  tempDir = mkdtempSync(join(tmpdir(), 'taglify-'));
  const filePath = join(tempDir, 'file.md');
  writeFileSync(filePath, 'untouched', 'utf8');

  const unchanged = taglifyText('<!-- TAG:START -->old<!-- TAG:END -->', { OTHER: 'new' });
  unchanged.write(filePath);
  expect(readFileSync(filePath, 'utf8')).toBe('untouched');

  const changed = taglifyText('<!-- TAG:START -->old<!-- TAG:END -->', { TAG: 'new' });
  changed.write(filePath);
  expect(readFileSync(filePath, 'utf8')).toBe(changed.text);
});
