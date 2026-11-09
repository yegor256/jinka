// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';

export const temp = (base) => Object.freeze({
  run: async (name, work) => {
    await mkdir(base, { recursive: true });
    const dir = await mkdtemp(join(base, `${basename(name, extname(name))}-`));
    try {
      return await work(dir);
    } finally {
      await rm(dir, { recursive: true, force: true, maxRetries: 5 });
    }
  }
});
