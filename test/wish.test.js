// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, mkdir, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, empty, containsString } from 'hamjest';
import { Wish } from '../src/wish.js';

describe('Wish', () => {
  it('names itself by its path inside the wishes directory', () => {
    const name = join(randomUUID(), `${randomUUID()}.md`);
    assertThat('name is not relative', new Wish('/nowhere', name, new Map()).name(), equalTo(name));
  });
  it('reads its text from the file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = `Make me happy ${randomUUID()}`;
    await mkdir(join(dir, 'sub'));
    await writeFile(join(dir, 'sub', 'a.md'), text);
    assertThat('text was not read', await new Wish(dir, join('sub', 'a.md'), new Map()).text(), equalTo(text));
  });
  it('deletes its file on close', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'b.md'), randomUUID());
    await new Wish(dir, 'b.md', new Map([['b.md', true]])).close();
    assertThat('file was not deleted', await readdir(dir), empty());
  });
  it('drops its claim on close', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const claims = new Map([['c.md', true]]);
    await writeFile(join(dir, 'c.md'), randomUUID());
    await new Wish(dir, 'c.md', claims).close();
    assertThat('claim was not dropped', claims.has('c.md'), equalTo(false));
  });
  it('releases its claim on free', () => {
    const claims = new Map([['d.md', true]]);
    new Wish('/nowhere', 'd.md', claims).free();
    assertThat('claim was not released', claims.get('d.md'), equalTo(false));
  });
  it('warns that its file will be deleted', () => {
    assertThat('fate does not mention deletion', new Wish('/nowhere', 'e.md', new Map()).fate(), containsString('deleted'));
  });
});
