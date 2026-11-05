// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { rmSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const semaphore = (file) => Object.freeze({
  acquire: async () => {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, String(process.pid), { flag: 'wx' }).catch((e) => {
      throw e.code === 'EEXIST' ? new Error(`Another jinka is running, because the file ${file} already exists`) : e;
    });
  },
  release: () => rmSync(file, { force: true })
});
