// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';

export class Disk {
  constructor(wishes, logs, memory) {
    this.wishes = wishes;
    this.logs = logs;
    this.memory = memory;
  }
  lines(wish) {
    return [
      `The wish is written in the file ${join(this.wishes, wish.name())}, ${wish.fate()}.`,
      `All wishes live in the directory ${this.wishes}, and you may add new wishes there as Markdown files.`,
      `Your memory lives in the directory ${this.memory}, keep there what the skills tell you to keep.`
    ];
  }
  args() {
    return ['--add-dir', this.wishes, '--add-dir', this.memory];
  }
  async log(wish) {
    const file = join(
      this.logs,
      `${wish.name().slice(0, wish.name().length - extname(wish.name()).length)}-${new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)}.jsonl`
    );
    await mkdir(dirname(file), { recursive: true });
    await mkdir(this.memory, { recursive: true });
    return createWriteStream(file);
  }
}
