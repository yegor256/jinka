// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, mkdir, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, not, hasItem, empty, promiseThat, rejected } from 'hamjest';
import { Wishes } from '../src/wishes.js';
import { Protocol } from '../src/protocol.js';

describe('Wishes', () => {
  it('finds a wish in a subdirectory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const sub = randomUUID();
    await mkdir(join(dir, sub));
    await writeFile(join(dir, sub, 'a.md'), randomUUID());
    assertThat('nested wish was not found', (await new Wishes(dir, 10).next(AbortSignal.timeout(5000))).name(), equalTo(join(sub, 'a.md')));
  });
  it('ignores files that are not markdown', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'a.txt'), randomUUID());
    await writeFile(join(dir, 'b.md'), randomUUID());
    assertThat('text file was taken', (await new Wishes(dir, 10).next(AbortSignal.timeout(5000))).name(), equalTo('b.md'));
  });
  it('never gives the same wish to two wands', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'a.md'), randomUUID());
    await writeFile(join(dir, 'b.md'), randomUUID());
    const wishes = new Wishes(dir, 10);
    const pair = await Promise.all([wishes.next(AbortSignal.timeout(5000)), wishes.next(AbortSignal.timeout(5000))]);
    assertThat('one wish was given twice', pair[0].name(), not(equalTo(pair[1].name())));
  });
  it('prefers a wish that was never tried', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'a.md'), randomUUID());
    await writeFile(join(dir, 'b.md'), randomUUID());
    const wishes = new Wishes(dir, 10);
    (await wishes.next(AbortSignal.timeout(5000))).free();
    assertThat('tried wish was preferred', (await wishes.next(AbortSignal.timeout(5000))).name(), equalTo('b.md'));
  });
  it('prefers the least recently tried wish', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'a.md'), randomUUID());
    await writeFile(join(dir, 'b.md'), randomUUID());
    const wishes = new Wishes(dir, 10);
    (await wishes.next(AbortSignal.timeout(5000))).free();
    (await wishes.next(AbortSignal.timeout(5000))).free();
    assertThat('recent wish was preferred', (await wishes.next(AbortSignal.timeout(5000))).name(), equalTo('a.md'));
  });
  it('waits for a wish that appears later', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `${randomUUID()}.md`;
    setTimeout(() => writeFile(join(dir, name), randomUUID()), 50);
    assertThat('late wish was missed', (await new Wishes(dir, 10).next(AbortSignal.timeout(5000))).name(), equalTo(name));
  });
  it('stops waiting when the signal aborts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await promiseThat('waiting did not stop', new Wishes(dir, 10).next(AbortSignal.timeout(50)), rejected());
  });
  it('archives a wish when an archive is given', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const archive = await mkdtemp(join(tmpdir(), 'jinka-'));
    const wishes = new Wishes(dir, 10, archive);
    setTimeout(() => writeFile(join(dir, 'a.md'), randomUUID()), 50);
    await (await wishes.next(AbortSignal.timeout(5000))).close();
    assertThat('wish was not archived', await readdir(archive), hasItem('a.md'));
  });
  it('keeps a capitalized wish that was there at startup', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `Q${randomUUID()}.md`;
    await writeFile(join(dir, name), randomUUID());
    await (await new Wishes(dir, 10).next(AbortSignal.timeout(5000))).close();
    assertThat('startup wish was deleted', await readdir(dir), equalTo([name]));
  });
  it('deletes a lowercase wish that was there at startup', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, `q${randomUUID()}.md`), randomUUID());
    await (await new Wishes(dir, 10).next(AbortSignal.timeout(5000))).close();
    assertThat('lowercase startup wish was kept', await readdir(dir), empty());
  });
  it('keeps a capitalized wish in a subdirectory that was there at startup', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const sub = `h${randomUUID()}`;
    await mkdir(join(dir, sub));
    await writeFile(join(dir, sub, 'Wx-ok.md'), randomUUID());
    await (await new Wishes(dir, 10).next(AbortSignal.timeout(5000))).close();
    assertThat('nested capitalized wish was deleted', await readdir(join(dir, sub)), equalTo(['Wx-ok.md']));
  });
  it('dont give a permanent wish again during the pause after success', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, `K${randomUUID()}.md`), randomUUID());
    const wishes = new Wishes(dir, 10, '', 60000);
    await (await wishes.next(AbortSignal.timeout(5000))).close();
    await promiseThat('permanent wish was given again without a pause', wishes.next(AbortSignal.timeout(200)), rejected());
  });
  it('deletes a wish that appeared after startup', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const wishes = new Wishes(dir, 10);
    setTimeout(() => writeFile(join(dir, `${randomUUID()}.md`), randomUUID()), 50);
    await (await wishes.next(AbortSignal.timeout(5000))).close();
    assertThat('late wish was not deleted', await readdir(dir), empty());
  });
  it('warns about wishes at startup that are not permanent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, `a${randomUUID()}.md`), randomUUID());
    await writeFile(join(dir, `b${randomUUID()}.md`), randomUUID());
    await writeFile(join(dir, `C${randomUUID()}.md`), randomUUID());
    const lines = [];
    await new Wishes(dir, 10, '', 0, new Protocol(lines)).next(AbortSignal.timeout(5000));
    assertThat('no warning about non-permanent wishes', lines, equalTo([['warn', `found 2 pre-existing wishes in ${dir} that are not permanent`]]));
  });
  it('dont warn when all wishes at startup are permanent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, `X${randomUUID()}.md`), randomUUID());
    const lines = [];
    await new Wishes(dir, 10, '', 0, new Protocol(lines)).next(AbortSignal.timeout(5000));
    assertThat('warned about permanent wishes', lines, empty());
  });
  it('dont claim a wish when aborted during the scan', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, `${randomUUID()}.md`), randomUUID());
    const controller = new AbortController();
    const wish = new Wishes(dir, 10).next(controller.signal);
    controller.abort();
    await promiseThat('aborted scan claimed a wish', wish, rejected());
  });
});
