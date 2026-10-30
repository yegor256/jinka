// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, empty } from 'hamjest';
import { Crew } from '../src/crew.js';
import { Jinka } from '../src/jinka.js';
import { Wishes } from '../src/wishes.js';
import { Row } from '../src/row.js';

describe('Jinka', () => {
  it('makes every late wish come true', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    setTimeout(() => Promise.all([1, 2, 3].map((i) => writeFile(join(dir, `${i}.md`), randomUUID()))), 50);
    await new Jinka(new Wishes(dir, 10), { run: async () => ({ code: 0, summary: '' }) }, { row: (i) => new Row([], i), notice: () => new Row([], 0) }, new Crew(2, 16, new Row([], 0))).run(AbortSignal.timeout(300));
    assertThat('some wishes were left', await readdir(dir), empty());
  });
});
