// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const field = (path, text, key) => {
  const head = text.split(/\r?\n/).slice(1);
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
      .map(async (e) => {
        const path = join(dir, e.name, 'SKILL.md');
        const text = await readFile(path, 'utf8');
        return `The skill "${field(path, text, 'name')}", described in ${path}: ${field(path, text, 'description')}`;
      })
  )
});
