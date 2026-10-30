// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { readdir } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { Wish } from './wish.js';
import { Archived } from './archived.js';
import { Permanent } from './permanent.js';

export class Wishes {
  constructor(dir, interval, archive = '', pause = 0, notice = { warn: () => {} }) {
    this.dir = dir;
    this.interval = interval;
    this.archive = archive;
    this.pause = pause;
    this.notice = notice;
    this.claims = new Map();
    this.startup = [];
  }
  async next(signal) {
    signal.throwIfAborted();
    const files = (await readdir(this.dir, { recursive: true, withFileTypes: true }))
      .filter((f) => f.isFile() && f.name.endsWith('.md'))
      .map((f) => join(relative(this.dir, f.parentPath), f.name))
      .sort();
    signal.throwIfAborted();
    if (this.startup.length === 0) {
      this.startup.push(new Set(files));
      const count = files.filter((f) => !/^[A-Z]/.test(basename(f))).length;
      if (count > 0) {
        this.notice.warn(`found ${count} pre-existing ${count === 1 ? 'wish' : 'wishes'} in ${this.dir} that ${count === 1 ? 'is' : 'are'} not permanent`);
      }
    }
    const path = files.find((f) => !this.claims.has(f))
      ?? [...this.claims.keys()].find((c) => !this.claims.get(c) && files.includes(c));
    if (path === undefined) {
      await setTimeout(this.interval, undefined, { signal });
      return this.next(signal);
    }
    this.claims.delete(path);
    this.claims.set(path, true);
    const wish = new Wish(this.dir, path, this.claims);
    if (this.startup[0].has(path) && /^[A-Z]/.test(basename(path))) {
      return new Permanent(wish, this.pause);
    }
    return this.archive === '' ? wish : new Archived(wish, this.dir, this.archive);
  }
}
