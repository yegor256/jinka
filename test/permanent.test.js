// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, containsString } from 'hamjest';
import { Permanent } from '../src/permanent.js';
import { Wish } from '../src/wish.js';

describe('Permanent', () => {
  it('keeps its file on close', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `${randomUUID()}.md`;
    await writeFile(join(dir, name), randomUUID());
    await new Permanent(new Wish(dir, name, new Map([[name, true]]))).close();
    assertThat('permanent file was deleted', await readdir(dir), equalTo([name]));
  });
  it('releases its claim on close', async () => {
    const claims = new Map([['a.md', true]]);
    await new Permanent(new Wish('/nowhere', 'a.md', claims)).close();
    assertThat('claim was not released', claims.get('a.md'), equalTo(false));
  });
  it('releases its claim on free', () => {
    const claims = new Map([['b.md', true]]);
    new Permanent(new Wish('/nowhere', 'b.md', claims)).free();
    assertThat('claim was not released', claims.get('b.md'), equalTo(false));
  });
  it('keeps the name of the wish', () => {
    const name = `${randomUUID()}.md`;
    assertThat('name was changed', new Permanent(new Wish('/nowhere', name, new Map())).name(), equalTo(name));
  });
  it('reads the text of the wish', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = randomUUID();
    await writeFile(join(dir, 'c.md'), text);
    assertThat('text was not read', await new Permanent(new Wish(dir, 'c.md', new Map())).text(), equalTo(text));
  });
  it('warns that its file must not be deleted', () => {
    assertThat('fate does not forbid deletion', new Permanent(new Wish('/nowhere', 'd.md', new Map())).fate(), containsString('must not delete'));
  });
});
