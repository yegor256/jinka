// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo } from 'hamjest';
import { Script } from './fixtures/script.js';

describe('jinka command', () => {
  it('archives all wishes and exits with code 130 on interrupt', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const archive = await mkdtemp(join(tmpdir(), 'jinka-'));
    const jinka = spawn(
      process.execPath,
      ['bin/jinka.js', '--agent', await new Script(0).path(), '--threads', '2', '--archive', archive, '--interval', '50', dir],
      { stdio: 'ignore' }
    );
    await setTimeout(500);
    await Promise.all(['a', 'b', 'c'].map((n) => writeFile(join(dir, `${n}.md`), randomUUID())));
    const deadline = Date.now() + 8000;
    while ((await readdir(archive)).length < 3 && Date.now() < deadline) {
      await setTimeout(50);
    }
    jinka.kill('SIGINT');
    const [code] = await Promise.race([
      once(jinka, 'exit'),
      setTimeout(5000).then(() => [-1])
    ]);
    assertThat('jinka did not exit with code 130', code, equalTo(130));
  });
  it('archives every late wish', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const archive = await mkdtemp(join(tmpdir(), 'jinka-'));
    const jinka = spawn(
      process.execPath,
      ['bin/jinka.js', '--agent', await new Script(0).path(), '--threads', '2', '--archive', archive, '--interval', '50', dir],
      { stdio: 'ignore' }
    );
    await setTimeout(500);
    await Promise.all(['a', 'b', 'c'].map((n) => writeFile(join(dir, `${n}.md`), randomUUID())));
    const deadline = Date.now() + 8000;
    while ((await readdir(archive)).length < 3 && Date.now() < deadline) {
      await setTimeout(50);
    }
    jinka.kill('SIGINT');
    await once(jinka, 'exit');
    assertThat('some late wishes were not archived', (await readdir(archive)).sort(), equalTo(['a.md', 'b.md', 'c.md']));
  });
});
