// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, containsString, equalTo } from 'hamjest';
import { Disk } from '../src/disk.js';
import { Wish } from '../src/wish.js';

describe('Disk', () => {
  it('tells the agent where its memory lives', async () => {
    const memory = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID());
    assertThat('memory was not mentioned', new Disk('/wishes', '/logs', memory, { size: () => 1 }).lines(new Wish('/wishes', 'a.md', new Map())).join('\n'), containsString(memory));
  });
  it('tells the agent how many threads run right now', () => {
    const size = 2 + Math.floor(Math.random() * 30);
    assertThat('thread count was not mentioned', new Disk('/wishes', '/logs', '/memory', { size: () => size }).lines(new Wish('/wishes', 'c.md', new Map())).join('\n'), containsString(`Jinka runs ${size} threads right now`));
  });
  it('grants the agent access to its memory', async () => {
    const memory = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID());
    assertThat('memory was not granted', new Disk('/wishes', '/logs', memory, { size: () => 1 }).args().join(' '), containsString(`--add-dir ${memory}`));
  });
  it('creates the memory directory', async () => {
    const memory = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID(), 'мозг');
    const log = await new Disk('/wishes', await mkdtemp(join(tmpdir(), 'jinka-')), memory, { size: () => 1 }).log(new Wish('/wishes', 'b.md', new Map()));
    await new Promise((resolve) => log.end(resolve));
    assertThat('memory directory was not created', (await stat(memory)).isDirectory(), equalTo(true));
  });
});
