// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { rmSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export class Semaphore {
  constructor(file) {
    this.file = file;
  }
  async acquire() {
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, String(process.pid), { flag: 'wx' }).catch((e) => {
      throw e.code === 'EEXIST' ? new Error(`Another jinka is running, because the file ${this.file} already exists`) : e;
    });
  }
  release() {
    rmSync(this.file, { force: true });
  }
}
