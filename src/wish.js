// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

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
  fate() {
    return 'which will be deleted once you exit with code zero';
  }
  async close() {
    await rm(join(this.dir, this.path));
    this.claims.delete(this.path);
  }
  free() {
    this.claims.set(this.path, false);
  }
}
