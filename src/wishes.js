// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { readdir } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { wish } from './wish.js';
import { archived } from './archived.js';
import { permanent } from './permanent.js';

export const wishes = (dir, interval, archive = '', pause = 0, notice = { warn: () => {} }) => {
  const claims = new Map();
  const startup = [];
  const next = async (signal) => {
    signal.throwIfAborted();
    const files = (await readdir(dir, { recursive: true, withFileTypes: true }))
      .filter((f) => f.isFile() && f.name.endsWith('.md'))
      .map((f) => join(relative(dir, f.parentPath), f.name))
      .sort();
    signal.throwIfAborted();
    if (startup.length === 0) {
      startup.push(new Set(files));
      const count = files.filter((f) => !/^[A-Z]/.test(basename(f))).length;
      if (count > 0) {
        notice.warn(`found ${count} pre-existing ${count === 1 ? 'wish' : 'wishes'} in ${dir} that ${count === 1 ? 'is' : 'are'} not permanent`);
      }
    }
    const path = files.find((f) => !claims.has(f))
      ?? [...claims.keys()].find((c) => !claims.get(c) && files.includes(c));
    if (path === undefined) {
      await setTimeout(interval, undefined, { signal });
      return next(signal);
    }
    claims.delete(path);
    claims.set(path, true);
    const w = wish(dir, path, claims);
    if (startup[0].has(path) && /^[A-Z]/.test(basename(path))) {
      return permanent(w, pause);
    }
    return archive === '' ? w : archived(w, dir, archive);
  };
  return Object.freeze({ next });
};
