// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * One wish, a Markdown file inside the wishes directory.
 * The wish shares the map of claims with the wishes directory,
 * so it can give its claim back when a wand is done with it.
 */
export class Wish {
  constructor(dir, path, claims) {
    this.dir = dir;
    this.path = path;
    this.claims = claims;
  }
  name() {
    return this.path;
  }
  async text() {
    return readFile(join(this.dir, this.path), 'utf8');
  }
  async close() {
    await rm(join(this.dir, this.path));
    this.claims.delete(this.path);
  }
  free() {
    this.claims.set(this.path, false);
  }
}
