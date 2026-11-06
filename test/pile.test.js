// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertThat, equalTo } from 'hamjest';
import { pile } from '../src/pile.js';

describe('pile', () => {
  it('counts nothing in an empty directory', async () => {
    assertThat('empty directory is not counted as zero', pile(await mkdtemp(join(tmpdir(), 'jinka-'))).text(), equalTo('0'));
  });
  it('counts wishes in nested directories', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await mkdir(join(dir, 'ä', 'b7'), { recursive: true });
    await writeFile(join(dir, 'x.md'), 'one');
    await writeFile(join(dir, 'ä', 'y-3.md'), 'two');
    await writeFile(join(dir, 'ä', 'b7', 'Zq.md'), 'three');
    assertThat('nested wishes are not counted', pile(dir).text(), equalTo('3'));
  });
  it('ignores files that are not Markdown', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'k.md'), 'wish');
    await writeFile(join(dir, 'k.txt'), 'note');
    assertThat('non-Markdown files are counted', pile(dir).text(), equalTo('1'));
  });
});
