// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, empty, hasItem, equalTo, matchesPattern } from 'hamjest';
import { Wand } from '../src/wand.js';
import { Wishes } from '../src/wishes.js';
import { Row } from '../src/row.js';

describe('Wand', () => {
  it('deletes a late wish after agent succeeds', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    setTimeout(() => writeFile(join(dir, 'a.md'), 'Make me happy'), 50);
    await new Wand(new Wishes(dir, 10), { run: async () => ({ code: 0, summary: '', tokens: '0', model: '' }) }, new Row([], 0), new Row([], 0)).run(AbortSignal.timeout(500));
    assertThat('wish was not deleted', await readdir(dir), empty());
  });
  it('keeps a capitalized startup wish after agent succeeds', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `P${randomUUID()}.md`;
    await writeFile(join(dir, name), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => ({ code: 0, summary: '', tokens: '0', model: '' }) }, new Row([], 0), new Row([], 0)).run(AbortSignal.timeout(300));
    assertThat('startup wish was deleted', await readdir(dir), equalTo([name]));
  });
  it('keeps wish after agent fails', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'b.md'), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => ({ code: 1, summary: '', tokens: '0', model: '' }) }, new Row([], 0), new Row([], 0)).run(AbortSignal.timeout(300));
    assertThat('failed wish was deleted', await readdir(dir), equalTo(['b.md']));
  });
  it('shows the wish name next to the agent progress', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `${randomUUID()}.md`;
    const lines = [];
    await writeFile(join(dir, name), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async (wish, row) => { row.show('working'); return { code: 0, summary: '' }; } }, new Row(lines, 0), new Row([], 0)).run(AbortSignal.timeout(300));
    assertThat('wish name was not shown', lines, hasItem(equalTo([0, `${name}\tworking`])));
  });
  it('shows idle in gray', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await new Wand(new Wishes(dir, 10), { run: async () => ({ code: 0, summary: '', tokens: '0', model: '' }) }, new Row(lines, 0), new Row([], 0)).run(AbortSignal.timeout(100));
    assertThat('idle was not gray', lines.map((l) => l[1]), hasItem(equalTo('\x1b[90midle\x1b[39m\t\x1b[90mwaiting for wishes\x1b[39m')));
  });
  it('reports a fulfilled wish to the protocol', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `${randomUUID()}.md`;
    const notes = [];
    await writeFile(join(dir, name), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => ({ code: 0, summary: '', tokens: '0', model: '' }) }, new Row([], 0), new Row(notes, 0)).run(AbortSignal.timeout(300));
    assertThat('fulfilled wish was not reported', notes, hasItem(equalTo([0, `done (${name} 00:00 0)`])));
  });
  it('reports a failed wish with its exit code to the protocol', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const notes = [];
    await writeFile(join(dir, 'c.md'), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => ({ code: 42, summary: '', tokens: '0', model: '' }) }, new Row([], 0), new Row(notes, 0)).run(AbortSignal.timeout(300));
    assertThat('failed wish was not reported', notes.map((n) => n[1]), hasItem(matchesPattern(/^failed with exit code 42 \(c\.md \d{2}:\d{2} 0\)$/)));
  });
  it('reports what was done for a fulfilled wish to the protocol', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const summary = `Merged PR #${randomUUID()} ü`;
    const notes = [];
    await writeFile(join(dir, 'd.md'), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => ({ code: 0, summary, tokens: '0', model: '' }) }, new Row([], 0), new Row(notes, 0)).run(AbortSignal.timeout(300));
    assertThat('summary of the fulfilled wish was not reported', notes, hasItem(equalTo([0, `${summary} (d.md 00:00 0)`])));
  });
  it('reports what was done for a failed wish to the protocol', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const summary = `Gave up on ${randomUUID()}`;
    const notes = [];
    await writeFile(join(dir, 'e.md'), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => ({ code: 7, summary, tokens: '0', model: '' }) }, new Row([], 0), new Row(notes, 0)).run(AbortSignal.timeout(300));
    assertThat('summary of the failed wish was not reported', notes.map((n) => n[1]), hasItem(equalTo(`failed with exit code 7: ${summary} (e.md 00:00 0)`)));
  });
  it('reports the tokens and the model of a wish to the protocol', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const notes = [];
    await writeFile(join(dir, 'f.md'), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => ({ code: 0, summary: 'Fixed it', tokens: '324K', model: 'Sonnet4.5' }) }, new Row([], 0), new Row(notes, 0)).run(AbortSignal.timeout(300));
    assertThat('tokens and model were not reported', notes, hasItem(equalTo([0, 'Fixed it (f.md 00:00 324K Sonnet4.5)'])));
  });
  it('reports the link of a fulfilled wish at the end of its protocol line', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const link = `https://github.com/q/w/issues/${Math.floor(Math.random() * 1000)}`;
    const notes = [];
    await writeFile(join(dir, 'g.md'), randomUUID());
    await new Wand(new Wishes(dir, 10), { run: async () => ({ code: 0, summary: 'Closed ü', link, tokens: '1K', model: '' }) }, new Row([], 0), new Row(notes, 0)).run(AbortSignal.timeout(300));
    assertThat('link was not reported', notes, hasItem(equalTo([0, `Closed ü (g.md 00:00 1K) ${link}`])));
  });
});
