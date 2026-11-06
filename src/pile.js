// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { readdirSync } from 'node:fs';

export const pile = (dir) => Object.freeze({
  text: () => `${readdirSync(dir, { recursive: true, withFileTypes: true }).filter((f) => f.isFile() && f.name.endsWith('.md')).length}`
});
