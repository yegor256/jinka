// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, promiseThat, equalTo, rejected, fulfilled } from 'hamjest';
import { Semaphore } from '../src/semaphore.js';

describe('Semaphore', () => {
  it('writes the process identifier into the file when acquired', async () => {
    const file = join(await mkdtemp(join(tmpdir(), 'jinka-')), `${randomUUID()}.txt`);
    await new Semaphore(file).acquire();
    assertThat('process identifier was not written', await readFile(file, 'utf8'), equalTo(String(process.pid)));
  });
  it('creates missing parent directories when acquired', async () => {
    const file = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID(), randomUUID(), 'pid.txt');
    await new Semaphore(file).acquire();
    await promiseThat('parent directories were not created', access(file), fulfilled());
  });
  it('refuses to acquire when the file already exists', async () => {
    const file = join(await mkdtemp(join(tmpdir(), 'jinka-')), `${randomUUID()}.txt`);
    await writeFile(file, randomUUID());
    await promiseThat('semaphore was acquired twice', new Semaphore(file).acquire(), rejected());
  });
  it('dont touch the file of another owner when refused', async () => {
    const file = join(await mkdtemp(join(tmpdir(), 'jinka-')), `${randomUUID()}.txt`);
    const owner = randomUUID();
    await writeFile(file, owner);
    await new Semaphore(file).acquire().catch(() => {});
    assertThat('file of another owner was changed', await readFile(file, 'utf8'), equalTo(owner));
  });
  it('deletes the file when released', async () => {
    const file = join(await mkdtemp(join(tmpdir(), 'jinka-')), `${randomUUID()}.txt`);
    const semaphore = new Semaphore(file);
    await semaphore.acquire();
    semaphore.release();
    await promiseThat('file was not deleted', access(file), rejected());
  });
  it('acquires again after being released', async () => {
    const file = join(await mkdtemp(join(tmpdir(), 'jinka-')), `${randomUUID()}.txt`);
    const semaphore = new Semaphore(file);
    await semaphore.acquire();
    semaphore.release();
    await promiseThat('semaphore was not acquired again', new Semaphore(file).acquire(), fulfilled());
  });
});
