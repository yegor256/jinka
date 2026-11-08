// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdir, mkdtemp, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, containsString, equalTo, not } from 'hamjest';
import { disk } from '../src/disk.js';
import { wish } from '../src/wish.js';

const directory = async (count) => {
  const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
  await mkdir(join(dir, 'вложено'));
  await Promise.all([...Array(count).keys()].map((i) => writeFile(join(dir, i % 2 === 0 ? '' : 'вложено', `w-${randomUUID()}.md`), `wish ${i}`)));
  await writeFile(join(dir, `${randomUUID()}.txt`), 'not a wish');
  return dir;
};

describe('disk', () => {
  it('tells the agent where its memory lives', async () => {
    const memory = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID());
    const dir = await directory(1);
    assertThat('memory was not mentioned', (await disk(dir, '/logs', memory, { size: () => 1 }).lines(wish(dir, 'a.md', new Map()))).join('\n'), containsString(memory));
  });
  it('limits the memory to what a skill tells the agent to keep', async () => {
    const memory = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID(), 'память');
    const dir = await directory(1);
    assertThat('memory was not limited to what a skill demands', (await disk(dir, '/logs', memory, { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString(`Your memory lives in the directory ${memory}; keep there only what a skill tells you to keep`));
  });
  it('forbids the agent to keep logs, handoffs, or instructions in its memory', async () => {
    const dir = await directory(1);
    assertThat('logs, handoffs, and instructions were not kept out of memory', (await disk(dir, '/logs', `/${randomUUID()}`, { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('never write anything else there, especially not logs, handoffs, or instructions for other wishes'));
  });
  it('tells the agent how many threads run right now', async () => {
    const size = 2 + Math.floor(Math.random() * 30);
    const dir = await directory(1);
    assertThat('thread count was not mentioned', (await disk(dir, '/logs', '/memory', { size: () => size }).lines(wish(dir, 'c.md', new Map()))).join('\n'), containsString(`Jinka runs ${size} threads right now`));
  });
  it('asks the agent to split a wish into smaller wishes next to it', async () => {
    const deep = join(randomUUID(), 'глубоко');
    const dir = await directory(1);
    assertThat('wish directory was not offered for smaller wishes', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, join(deep, 'x.md'), new Map()))).join('\n'), containsString(`write each of them as a separate Markdown file in the directory ${join(dir, deep)}`));
  });
  it('asks the agent to start names of new wish files with a small letter', async () => {
    const dir = await directory(1);
    assertThat('small first letter was not demanded', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('start the name of every new wish file with a small English letter, never with a capital one'));
  });
  it('asks the agent to keep every new wish short', async () => {
    const dir = await directory(1);
    assertThat('length of a new wish was not limited', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('Keep every new wish shorter than 1000 characters'));
  });
  it('forbids the agent to copy the current wish into a new wish', async () => {
    const dir = await directory(1);
    assertThat('copying of the current wish was not forbidden', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('Never copy the text of the current wish, or of these instructions, into a new wish'));
  });
  it('forbids a new wish to refer to any file in the memory directory', async () => {
    const memory = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID(), 'память');
    const dir = await directory(1);
    assertThat('references to memory files were not forbidden', (await disk(dir, '/logs', memory, { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString(`Never let a new wish refer to any file in the directory ${memory}`));
  });
  it('forbids the agent to carry its own rules into a new wish', async () => {
    const dir = await directory(1);
    assertThat('invented rules were not kept out of a new wish', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('never carry into it any rule, condition, or contract that you invented, nor ask it to pass rules onward'));
  });
  it('lets the agent copy word for word only what the user asked to pass along', async () => {
    const dir = await directory(1);
    assertThat('copying was not limited to the words of the user', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('copy into it, word for word, only what the user wrote in a permanent wish and explicitly asked to pass along'));
  });
  it('asks the agent to copy the condition of use together with what the user asked to pass along', async () => {
    const dir = await directory(1);
    assertThat('the condition of use was not copied together with the credentials', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('always together with the exact condition, word for word, under which the user allowed it to be used'));
  });
  it('lets the agent notify anyone only under the exact condition of the wish', async () => {
    const dir = await directory(1);
    assertThat('notifications were not limited to the condition of the wish', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('Notify anyone only under the exact condition that a wish states'));
  });
  it('forbids the agent to notify anyone about a routine result', async () => {
    const dir = await directory(1);
    assertThat('a routine result was still a reason to notify', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('a routine result is never a reason to notify, such as a merge, a triage, nothing to do, or work waiting for CI or for a person'));
  });
  it('does not let the agent copy whatever facts a new wish cannot find', async () => {
    const dir = await directory(1);
    assertThat('copying of any missing facts was still allowed', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), not(containsString('copy only the facts that the new wish cannot find on its own')));
  });
  it('asks the agent to leave evidence and history out of a new wish', async () => {
    const dir = await directory(1);
    assertThat('evidence was not left out of a new wish', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('Leave evidence, observations, logs, and the history of your work out of a new wish'));
  });
  it('limits new wishes of one run to the number of threads', async () => {
    const size = 2 + Math.floor(Math.random() * 30);
    const dir = await directory(1);
    assertThat('new wishes were not limited by threads', (await disk(dir, '/logs', '/memory', { size: () => size }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString(`Write at most ${size} new wishes while doing this wish`));
  });
  it('tells the agent how many wishes the directory holds', async () => {
    const count = 3 + Math.floor(Math.random() * 40);
    const dir = await directory(count);
    assertThat('wish count was not mentioned', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString(`holds ${count} wishes right now`));
  });
  it('forbids new wishes when the directory holds a hundred wishes', async () => {
    const dir = await directory(100 + Math.floor(Math.random() * 20));
    assertThat('new wishes were not forbidden in a full directory', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('write no new wish at all'));
  });
  it('asks the agent to do one small piece of the wish when the directory holds a hundred wishes', async () => {
    const dir = await directory(100 + Math.floor(Math.random() * 20));
    assertThat('one small piece was not asked in a full directory', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('do only one small piece of this wish yourself'));
  });
  it('dont ask the agent to do the whole wish itself when the directory holds a hundred wishes', async () => {
    const dir = await directory(100 + Math.floor(Math.random() * 20));
    assertThat('the whole wish was still demanded in a full directory', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), not(containsString('do all of it yourself')));
  });
  it('dont mention handing over waiting when the directory holds a hundred wishes', async () => {
    const dir = await directory(100 + Math.floor(Math.random() * 20));
    assertThat('handing over waiting was still mentioned in a full directory', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), not(containsString('hand over waiting')));
  });
  it('dont limit the agent to one small piece when the directory holds few wishes', async () => {
    const dir = await directory(1 + Math.floor(Math.random() * 98));
    assertThat('one small piece was demanded in a directory that is not full', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), not(containsString('do only one small piece of this wish')));
  });
  it('forbids the agent to delete the file of its own wish', async () => {
    const dir = await directory(1);
    assertThat('deletion of the wish file was not forbidden', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('Never delete, move, or rename the file of this wish yourself'));
  });
  it('forbids the agent to modify any existing wish file', async () => {
    const dir = await directory(1);
    assertThat('modification of wish files was not forbidden', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('Never modify any existing wish file'));
  });
  it('asks the agent to work in git worktrees', async () => {
    const dir = await directory(1);
    assertThat('git worktrees were not demanded', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('do all your work inside a separate Git worktree'));
  });
  it('forbids the agent to wait while doing a wish', async () => {
    const dir = await directory(1);
    assertThat('waiting was not forbidden', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('Never spend time waiting while doing a wish'));
  });
  it('asks the agent to leave alone the work that must wait', async () => {
    const dir = await directory(1);
    assertThat('waiting work was not left alone', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('if something must happen first, leave that work alone and complete the current wish right away'));
  });
  it('does not ask the agent to write a new wish that waits', async () => {
    const dir = await directory(1);
    assertThat('a waiting wish was still demanded', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), not(containsString('write a new wish that waits')));
  });
  it('does not ask the agent to write a new wish instead of scheduling', async () => {
    const dir = await directory(1);
    assertThat('a new wish was still demanded instead of scheduling', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), not(containsString('but write a new wish instead')));
  });
  it('forbids the agent to schedule work for later', async () => {
    const dir = await directory(1);
    assertThat('scheduling of future work was not forbidden', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('Never schedule work for later'));
  });
  it('forbids the agent to write a new wish similar to an existing one', async () => {
    const dir = await directory(1);
    assertThat('duplicate wishes were not forbidden', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('Never write a new wish if a similar wish already exists'));
  });
  it('asks the agent to look for a similar wish only right before writing a new one', async () => {
    const dir = await directory(2);
    assertThat('search for similar wishes was not deferred', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('only right before you write a new wish'));
  });
  it('asks the agent to look for a similar wish by the names of files first', async () => {
    const dir = await directory(3);
    assertThat('file names were not suggested for the search', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), containsString('names of the wish files first'));
  });
  it('dont ask the agent to look through the existing wishes up front', async () => {
    const dir = await directory(1);
    assertThat('agent was asked to look through all wishes', (await disk(dir, '/logs', '/memory', { size: () => 1 }).lines(wish(dir, `${randomUUID()}.md`, new Map()))).join('\n'), not(containsString('look through the existing wishes')));
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
