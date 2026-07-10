import { readFileSync } from 'node:fs';

import { taglifyFile } from '../src/index';

const backlog = readFileSync('./BACKLOG.md', 'utf8');
const titles = [...backlog.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

const roadmap = titles
  .slice(0, 5)
  .map((title) => `- [ ] ${title}.`)
  .join('\n');

taglifyFile('./README.md', { ROADMAP: roadmap }, { throwOnError: true });
