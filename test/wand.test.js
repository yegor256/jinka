// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, empty, hasItem, startsWith, equalTo, matchesPattern } from 'hamjest';
import { Wand } from '../src/wand.js';
import { Wishes } from '../src/wishes.js';
import { Row } from '../src/row.js';

describe('Wand', () => {
  it('deletes a late wish after agent succeeds', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    setTimeout(() => writeFile(join(dir, 'a.md'), 'Make me happy'), 50);
    await new Wand(new Wishes(dir, 10), { run: async () => 0 }, new Row([], 0), new Row([], 0)).run(AbortSignal.timeout(500));
    assertThat('wish was not deleted', await readdir(dir), empty());
  });
  it('keeps a startup wish after agent succeeds', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `${randomUUID()}.md`;
    await writeFile(join(dir, name), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => 0 }, new Row([], 0), new Row([], 0)).run(AbortSignal.timeout(300));
    assertThat('startup wish was deleted', await readdir(dir), equalTo([name]));
  });
  it('keeps wish after agent fails', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'b.md'), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => 1 }, new Row([], 0), new Row([], 0)).run(AbortSignal.timeout(300));
    assertThat('failed wish was deleted', await readdir(dir), equalTo(['b.md']));
  });
  it('shows the wish name next to the agent progress', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `${randomUUID()}.md`;
    const lines = [];
    await writeFile(join(dir, name), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async (wish, row) => { row.show('working'); return 0; } }, new Row(lines, 0), new Row([], 0)).run(AbortSignal.timeout(300));
    assertThat('wish name was not shown', lines, hasItem(equalTo([0, `${name}\tworking`])));
  });
  it('shows idle when there are no wishes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await new Wand(new Wishes(dir, 10), { run: async () => 0 }, new Row(lines, 0), new Row([], 0)).run(AbortSignal.timeout(100));
    assertThat('idle was not shown', lines.map((l) => l[1]), hasItem(startsWith('idle')));
  });
  it('reports a fulfilled wish to the protocol', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `${randomUUID()}.md`;
    const notes = [];
    await writeFile(join(dir, name), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => 0 }, new Row([], 0), new Row(notes, 3)).run(AbortSignal.timeout(300));
    assertThat('fulfilled wish was not reported', notes, hasItem(equalTo([3, `${name}\tdone in 00:00`])));
  });
  it('reports a failed wish with its exit code to the protocol', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const notes = [];
    await writeFile(join(dir, 'c.md'), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => 42 }, new Row([], 0), new Row(notes, 1)).run(AbortSignal.timeout(300));
    assertThat('failed wish was not reported', notes.map((n) => n[1]), hasItem(matchesPattern(/^c\.md\tfailed with exit code 42 after \d{2}:\d{2}$/)));
  });
});
