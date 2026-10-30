// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, empty, hasSize } from 'hamjest';
import { Archived } from '../src/archived.js';
import { Wish } from '../src/wish.js';

describe('Archived', () => {
  it('moves the file into the archive keeping its subdirectory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const archive = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = randomUUID();
    await mkdir(join(dir, 'deep'));
    await writeFile(join(dir, 'deep', 'a.md'), text);
    await new Archived(new Wish(dir, join('deep', 'a.md'), new Map()), dir, archive).close();
    assertThat('file was not archived', await readFile(join(archive, 'deep', 'a.md'), 'utf8'), equalTo(text));
  });
  it('removes the original file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const archive = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'b.md'), randomUUID());
    await new Archived(new Wish(dir, 'b.md', new Map()), dir, archive).close();
    assertThat('original was not removed', await readdir(dir), empty());
  });
  it('adds a timestamp when the name clashes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const archive = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'c.md'), randomUUID());
    await writeFile(join(archive, 'c.md'), randomUUID());
    await new Archived(new Wish(dir, 'c.md', new Map()), dir, archive).close();
    assertThat('clashing file was overwritten', await readdir(archive), hasSize(2));
  });
  it('keeps the name of the wish', () => {
    assertThat('name was changed', new Archived(new Wish('/a', 'x/y.md', new Map()), '/a', '/b').name(), equalTo('x/y.md'));
  });
  it('releases the claim of the wish on free', () => {
    const claims = new Map([['e.md', true]]);
    new Archived(new Wish('/a', 'e.md', claims), '/a', '/b').free();
    assertThat('claim was not released', claims.get('e.md'), equalTo(false));
  });
});
