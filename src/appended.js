// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const appended = (path) => Object.freeze({
  write: (text) => {
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, text);
  }
});
