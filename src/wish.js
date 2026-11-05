// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

export const wish = (dir, path, claims) => Object.freeze({
  name: () => path,
  text: async () => readFile(join(dir, path), 'utf8'),
  fate: () => 'which will be deleted once you exit with code zero',
  close: async () => {
    await rm(join(dir, path), { force: true });
    claims.delete(path);
  },
  free: () => claims.set(path, false)
});
