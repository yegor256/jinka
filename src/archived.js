// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { copyFile, mkdir, access } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';

export class Archived {
  constructor(origin, dir, archive) {
    this.origin = origin;
    this.dir = dir;
    this.archive = archive;
  }
  name() {
    return this.origin.name();
  }
  async text() {
    return this.origin.text();
  }
  fate() {
    return this.origin.fate();
  }
  async close() {
    await copyFile(join(this.dir, this.origin.name()), await this.#target());
    await this.origin.close();
  }
  free() {
    this.origin.free();
  }
  async #target() {
    const target = join(this.archive, this.origin.name());
    await mkdir(dirname(target), { recursive: true });
    return access(target).then(
      () => `${target.slice(0, target.length - extname(target).length)}-${Date.now()}${extname(target)}`,
      () => target
    );
  }
}
