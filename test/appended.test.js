// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo } from 'hamjest';
import { appended } from '../src/appended.js';

describe('appended', () => {
  it('creates the missing directories of the file', async () => {
    const path = join(await mkdtemp(join(tmpdir(), 'jinka-')), 'глубоко', randomUUID(), 'p.txt');
    const text = `${randomUUID()}\n`;
    appended(path).write(text);
    assertThat('file was not created', await readFile(path, 'utf8'), equalTo(text));
  });
  it('appends every chunk to the end of the file', async () => {
    const path = join(await mkdtemp(join(tmpdir(), 'jinka-')), 'p.txt');
    const file = appended(path);
    const chunks = [`${randomUUID()}\n`, `ünï ${randomUUID()}\n`];
    chunks.forEach((c) => file.write(c));
    assertThat('chunks were not appended in order', await readFile(path, 'utf8'), equalTo(chunks.join('')));
  });
});
