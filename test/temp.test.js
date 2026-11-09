// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, empty, startsWith, promiseThat, rejected } from 'hamjest';
import { temp } from '../src/temp.js';

describe('temp', () => {
  it('gives a directory that exists while the work runs', async () => {
    assertThat(
      'directory was missing during the work',
      await temp(await mkdtemp(join(tmpdir(), 'jinka-'))).run(`${randomUUID()}.md`, async (dir) => existsSync(dir)),
      equalTo(true)
    );
  });
  it('places the directory inside the folder it was given', async () => {
    const base = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID());
    assertThat('directory was placed elsewhere', await temp(base).run(`${randomUUID()}.md`, async (dir) => dirname(dir)), equalTo(base));
  });
  it('names the directory after the wish', async () => {
    const name = `fix-${randomUUID()}`;
    assertThat(
      'directory was not named after the wish',
      await temp(await mkdtemp(join(tmpdir(), 'jinka-'))).run(join('deep', `${name}.md`), async (dir) => basename(dir)),
      startsWith(`${name}-`)
    );
  });
  it('gives a fresh directory to every run of the same wish', async () => {
    const t = temp(await mkdtemp(join(tmpdir(), 'jinka-')));
    const name = `${randomUUID()}.md`;
    assertThat('two runs shared one directory', await t.run(name, async (outer) => t.run(name, async (inner) => outer === inner)), equalTo(false));
  });
  it('returns what the work returns', async () => {
    const text = randomUUID();
    assertThat('result of the work was lost', await temp(await mkdtemp(join(tmpdir(), 'jinka-'))).run('a.md', async () => text), equalTo(text));
  });
  it('deletes the directory with its content after the work succeeds', async () => {
    const base = await mkdtemp(join(tmpdir(), 'jinka-'));
    await temp(base).run(`${randomUUID()}.md`, async (dir) => {
      await mkdir(join(dir, randomUUID(), randomUUID()), { recursive: true });
      await writeFile(join(dir, `${randomUUID()}.txt`), randomUUID());
    });
    assertThat('directory was left behind after success', await readdir(base), empty());
  });
  it('deletes the directory with its content after the work fails', async () => {
    const base = await mkdtemp(join(tmpdir(), 'jinka-'));
    await temp(base).run(`${randomUUID()}.md`, async (dir) => {
      await writeFile(join(dir, `${randomUUID()}.txt`), randomUUID());
      throw new Error(randomUUID());
    }).catch(() => {});
    assertThat('directory was left behind after failure', await readdir(base), empty());
  });
  it('passes the failure of the work on', async () => {
    await promiseThat(
      temp(await mkdtemp(join(tmpdir(), 'jinka-'))).run('b.md', async () => {
        throw new Error(randomUUID());
      }),
      rejected()
    );
  });
});
