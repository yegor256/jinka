// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, empty, hasItem, startsWith, equalTo } from 'hamjest';
import { Wand } from '../src/wand.js';
import { Wishes } from '../src/wishes.js';
import { Row } from '../src/row.js';

describe('Wand', () => {
  it('deletes wish after agent succeeds', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'a.md'), 'Make me happy');
    await new Wand(new Wishes(dir, 10), { run: async () => 0 }, new Row([], 0)).run(AbortSignal.timeout(500));
    assertThat('wish was not deleted', await readdir(dir), empty());
  });
  it('keeps wish after agent fails', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'b.md'), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => 1 }, new Row([], 0)).run(AbortSignal.timeout(300));
    assertThat('failed wish was deleted', await readdir(dir), equalTo(['b.md']));
  });
  it('shows the wish name next to the agent progress', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `${randomUUID()}.md`;
    const lines = [];
    await writeFile(join(dir, name), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async (wish, row) => { row.show('working'); return 0; } }, new Row(lines, 0)).run(AbortSignal.timeout(300));
    assertThat('wish name was not shown', lines, hasItem(equalTo([0, `${name}\tworking`])));
  });
  it('shows idle when there are no wishes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await new Wand(new Wishes(dir, 10), { run: async () => 0 }, new Row(lines, 0)).run(AbortSignal.timeout(100));
    assertThat('idle was not shown', lines.map((l) => l[1]), hasItem(startsWith('idle')));
  });
});
