// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { copyFile, mkdir, access } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';

/**
 * A wish that goes into the archive directory instead of disappearing.
 * The archived copy keeps the subdirectory of the wish, and gets a
 * timestamp in its name when a file with the same name is already there.
 */
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
