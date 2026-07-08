import { expect, test } from 'bun:test';

import { placeholder } from './index';

test('placeholder', () => {
  expect(placeholder()).toBe('taglify');
});
