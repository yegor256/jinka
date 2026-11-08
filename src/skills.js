// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const field = (path, text, key) => {
  const [first, ...head] = text.split(/\r?\n/);
  if (first !== '---') {
    throw new Error(`The skill file ${path} does not start with the "---" line of its front matter`);
  }
  if (!head.includes('---')) {
    throw new Error(`The skill file ${path} has no closing "---" line of its front matter`);
  }
  const matter = head.slice(0, head.indexOf('---'));
  const start = matter.findIndex((l) => l.startsWith(`${key}:`));
  if (start < 0) {
    throw new Error(`The skill file ${path} has no "${key}" in its front matter`);
  }
  const rest = matter.slice(start + 1);
  const end = rest.findIndex((l) => l !== '' && !/^\s/.test(l));
  return [matter[start].slice(key.length + 1).replace(/^\s*[|>][-+]?\s*$/, ''), ...rest.slice(0, end < 0 ? rest.length : end)]
    .join(' ').replace(/\s+/g, ' ').trim();
};

export const skills = (dir) => Object.freeze({
  lines: async () => Promise.all(
    (await readdir(dir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .sort((a, b) => (a.name < b.name ? -1 : 1))
      .map(async (e) => {
        const path = join(dir, e.name, 'SKILL.md');
        const text = await readFile(path, 'utf8');
        return `The skill "${field(path, text, 'name')}", described in ${path}: ${field(path, text, 'description')}`;
      })
  )
});
