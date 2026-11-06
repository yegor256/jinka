// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, empty } from 'hamjest';
import { crew } from '../src/crew.js';
import { jinka } from '../src/jinka.js';
import { wishes } from '../src/wishes.js';
import { row } from '../src/row.js';
import { protocol } from '../src/protocol.js';

describe('jinka', () => {
  it('makes every late wish come true', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    setTimeout(() => Promise.all([1, 2, 3].map((i) => writeFile(join(dir, `${i}.md`), randomUUID()))), 50);
    await jinka(wishes(dir, 10), { run: async () => ({ code: 0, summary: '', tokens: '0', model: '' }) }, { row: (i) => row([], i), notice: () => protocol([]) }, crew(2, 16, protocol([])), 0).run(AbortSignal.timeout(300));
    assertThat('some wishes were left', await readdir(dir), empty());
  });
});
