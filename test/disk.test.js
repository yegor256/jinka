// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, containsString, equalTo } from 'hamjest';
import { disk } from '../src/disk.js';
import { wish } from '../src/wish.js';

describe('disk', () => {
  it('tells the agent where its memory lives', async () => {
    const memory = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID());
    assertThat('memory was not mentioned', disk('/wishes', '/logs', memory, { size: () => 1 }).lines(wish('/wishes', 'a.md', new Map())).join('\n'), containsString(memory));
  });
  it('tells the agent how many threads run right now', () => {
    const size = 2 + Math.floor(Math.random() * 30);
    assertThat('thread count was not mentioned', disk('/wishes', '/logs', '/memory', { size: () => size }).lines(wish('/wishes', 'c.md', new Map())).join('\n'), containsString(`Jinka runs ${size} threads right now`));
  });
  it('asks the agent to split a wish into smaller wishes next to it', () => {
    const deep = join(randomUUID(), 'глубоко');
    assertThat('wish directory was not offered for smaller wishes', disk('/wishes', '/logs', '/memory', { size: () => 1 }).lines(wish('/wishes', join(deep, 'x.md'), new Map())).join('\n'), containsString(`write each of them as a separate Markdown file in the directory ${join('/wishes', deep)}`));
  });
  it('asks the agent to start names of new wish files with a small letter', () => {
    assertThat('small first letter was not demanded', disk('/wishes', '/logs', '/memory', { size: () => 1 }).lines(wish('/wishes', `${randomUUID()}.md`, new Map())).join('\n'), containsString('start the name of every new wish file with a small English letter, never with a capital one'));
  });
  it('asks the agent to keep every new wish short', () => {
    assertThat('length of a new wish was not limited', disk('/wishes', '/logs', '/memory', { size: () => 1 }).lines(wish('/wishes', `${randomUUID()}.md`, new Map())).join('\n'), containsString('Keep every new wish shorter than 1000 characters'));
  });
  it('forbids the agent to copy the current wish into a new wish', () => {
    assertThat('copying of the current wish was not forbidden', disk('/wishes', '/logs', '/memory', { size: () => 1 }).lines(wish('/wishes', `${randomUUID()}.md`, new Map())).join('\n'), containsString('Never copy the text of the current wish, or of these instructions, into a new wish'));
  });
  it('asks the agent to leave evidence and history out of a new wish', () => {
    assertThat('evidence was not left out of a new wish', disk('/wishes', '/logs', '/memory', { size: () => 1 }).lines(wish('/wishes', `${randomUUID()}.md`, new Map())).join('\n'), containsString('Leave evidence, observations, logs, and the history of your work out of a new wish'));
  });
  it('forbids the agent to delete the file of its own wish', () => {
    assertThat('deletion of the wish file was not forbidden', disk('/wishes', '/logs', '/memory', { size: () => 1 }).lines(wish('/wishes', `${randomUUID()}.md`, new Map())).join('\n'), containsString('Never delete, move, or rename the file of this wish yourself'));
  });
  it('asks the agent to work in git worktrees', () => {
    assertThat('git worktrees were not demanded', disk('/wishes', '/logs', '/memory', { size: () => 1 }).lines(wish('/wishes', `${randomUUID()}.md`, new Map())).join('\n'), containsString('do all your work inside a separate Git worktree'));
  });
  it('asks the agent to hand any waiting over to a new wish', () => {
    assertThat('waiting was not handed over to a new wish', disk('/wishes', '/logs', '/memory', { size: () => 1 }).lines(wish('/wishes', `${randomUUID()}.md`, new Map())).join('\n'), containsString('Never spend time waiting while doing a wish'));
  });
  it('grants the agent access to its memory', async () => {
    const memory = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID());
    assertThat('memory was not granted', disk('/wishes', '/logs', memory, { size: () => 1 }).args().join(' '), containsString(`--add-dir ${memory}`));
  });
  it('creates the memory directory', async () => {
    const memory = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID(), 'мозг');
    const log = await disk('/wishes', await mkdtemp(join(tmpdir(), 'jinka-')), memory, { size: () => 1 }).log(wish('/wishes', 'b.md', new Map()));
    await new Promise((resolve) => log.end(resolve));
    assertThat('memory directory was not created', (await stat(memory)).isDirectory(), equalTo(true));
  });
});
