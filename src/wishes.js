// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { Wish } from './wish.js';
import { Archived } from './archived.js';

/**
 * The directory with wishes, shared by all wands.
 * It is the only object with mutable state: a map of claims, where the
 * order of entries tells how recently each wish was tried and the value
 * tells whether a wand holds it now. A wish is claimed synchronously
 * right after the scan, so two wands never get the same file.
 */
export class Wishes {
  constructor(dir, interval, archive = '') {
    this.dir = dir;
    this.interval = interval;
    this.archive = archive;
    this.claims = new Map();
  }
  async next(signal) {
    signal.throwIfAborted();
    const files = (await readdir(this.dir, { recursive: true, withFileTypes: true }))
      .filter((f) => f.isFile() && f.name.endsWith('.md'))
      .map((f) => join(relative(this.dir, f.parentPath), f.name))
      .sort();
    const path = files.find((f) => !this.claims.has(f))
      ?? [...this.claims.keys()].find((c) => !this.claims.get(c) && files.includes(c));
    if (path === undefined) {
      await setTimeout(this.interval, undefined, { signal });
      return this.next(signal);
    }
    this.claims.delete(path);
    this.claims.set(path, true);
    const wish = new Wish(this.dir, path, this.claims);
    return this.archive === '' ? wish : new Archived(wish, this.dir, this.archive);
  }
}
