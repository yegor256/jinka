// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { assertThat, equalTo, containsString } from 'hamjest';
import { Permanent } from '../src/permanent.js';
import { Wish } from '../src/wish.js';

describe('Permanent', () => {
  it('keeps its file on close', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `${randomUUID()}.md`;
    await writeFile(join(dir, name), randomUUID());
    await new Permanent(new Wish(dir, name, new Map([[name, true]])), 1).close();
    assertThat('permanent file was deleted', await readdir(dir), equalTo([name]));
  });
  it('keeps its claim during the pause after close', async () => {
    const claims = new Map([['a.md', true]]);
    await new Permanent(new Wish('/nowhere', 'a.md', claims), 60000).close();
    assertThat('claim was released before the pause ended', claims.get('a.md'), equalTo(true));
  });
  it('releases its claim after the pause', async () => {
    const claims = new Map([['e.md', true]]);
    await new Permanent(new Wish('/nowhere', 'e.md', claims), 7).close();
    await setTimeout(100);
    assertThat('claim was not released after the pause', claims.get('e.md'), equalTo(false));
  });
  it('releases its claim on free', () => {
    const claims = new Map([['b.md', true]]);
    new Permanent(new Wish('/nowhere', 'b.md', claims), 60000).free();
    assertThat('claim was not released', claims.get('b.md'), equalTo(false));
  });
  it('keeps the name of the wish', () => {
    const name = `${randomUUID()}.md`;
    assertThat('name was changed', new Permanent(new Wish('/nowhere', name, new Map()), 3).name(), equalTo(name));
  });
  it('reads the text of the wish', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = randomUUID();
    await writeFile(join(dir, 'c.md'), text);
    assertThat('text was not read', await new Permanent(new Wish(dir, 'c.md', new Map()), 5).text(), equalTo(text));
  });
  it('warns that its file must not be deleted', () => {
    assertThat('fate does not forbid deletion', new Permanent(new Wish('/nowhere', 'd.md', new Map()), 9).fate(), containsString('must not delete'));
  });
});
