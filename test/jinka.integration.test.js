// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, mkdir, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, containsString, not } from 'hamjest';
import { Script } from './fixtures/script.js';

describe('jinka command', () => {
  it('archives all wishes and exits with code 130 on interrupt', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const archive = await mkdtemp(join(tmpdir(), 'jinka-'));
    const jinka = spawn(
      process.execPath,
      ['bin/jinka.js', '--agent', await new Script(0).path(), '--threads', '2', '--archive', archive, '--logs', await mkdtemp(join(tmpdir(), 'jinka-')), '--interval', '50', '--wishes', dir],
      { stdio: ['pipe', 'ignore', 'ignore'] }
    );
    await setTimeout(500);
    await Promise.all(['a', 'b', 'c'].map((n) => writeFile(join(dir, `${n}.md`), randomUUID())));
    const deadline = Date.now() + 8000;
    while ((await readdir(archive)).length < 3 && Date.now() < deadline) {
      await setTimeout(50);
    }
    jinka.stdin.write('\x03');
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
      ['bin/jinka.js', '--agent', await new Script(0).path(), '--threads', '2', '--archive', archive, '--logs', await mkdtemp(join(tmpdir(), 'jinka-')), '--interval', '50', '--wishes', dir],
      { stdio: ['pipe', 'ignore', 'ignore'] }
    );
    await setTimeout(500);
    await Promise.all(['a', 'b', 'c'].map((n) => writeFile(join(dir, `${n}.md`), randomUUID())));
    const deadline = Date.now() + 8000;
    while ((await readdir(archive)).length < 3 && Date.now() < deadline) {
      await setTimeout(50);
    }
    jinka.stdin.write('\x03');
    await once(jinka, 'exit');
    assertThat('some late wishes were not archived', (await readdir(archive)).sort(), equalTo(['a.md', 'b.md', 'c.md']));
  });
  it('archives wishes into the home directory by default', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const home = await mkdtemp(join(tmpdir(), 'jinka-'));
    const archive = join(home, '.jinka', 'archive');
    const jinka = spawn(
      process.execPath,
      ['bin/jinka.js', '--agent', await new Script(0).path(), '--interval', '50', '--wishes', dir],
      { stdio: ['pipe', 'ignore', 'ignore'], env: { ...process.env, HOME: home, USERPROFILE: home } }
    );
    await setTimeout(500);
    await writeFile(join(dir, 'a.md'), randomUUID());
    const deadline = Date.now() + 8000;
    while ((await readdir(archive).catch(() => [])).length < 1 && Date.now() < deadline) {
      await setTimeout(50);
    }
    jinka.stdin.write('\x03');
    await once(jinka, 'exit');
    assertThat('the wish was not archived into the home directory', await readdir(archive).catch(() => []), equalTo(['a.md']));
  });
  it('reads wishes from the home directory by default', async () => {
    const home = await mkdtemp(join(tmpdir(), 'jinka-'));
    const dir = join(home, '.jinka', 'wishes');
    const archive = join(home, '.jinka', 'archive');
    await mkdir(dir, { recursive: true });
    const jinka = spawn(
      process.execPath,
      ['bin/jinka.js', '--agent', await new Script(0).path(), '--interval', '50'],
      { stdio: ['pipe', 'ignore', 'ignore'], env: { ...process.env, HOME: home, USERPROFILE: home } }
    );
    await setTimeout(500);
    await writeFile(join(dir, 'a.md'), randomUUID());
    const deadline = Date.now() + 8000;
    while ((await readdir(archive).catch(() => [])).length < 1 && Date.now() < deadline) {
      await setTimeout(50);
    }
    jinka.stdin.write('\x03');
    await once(jinka, 'exit');
    assertThat('the wish was not read from the home directory', await readdir(archive).catch(() => []), equalTo(['a.md']));
  });
  it('prints help with option descriptions', () => {
    assertThat(
      'help did not describe the threads option',
      spawnSync(process.execPath, ['bin/jinka.js', '--help'], { encoding: 'utf8', timeout: 5000 }).stdout,
      containsString('how many wishes run at once')
    );
  });
  it('pauses permanent wishes for one minute by default', () => {
    assertThat(
      'help did not show a one minute default pause',
      spawnSync(process.execPath, ['bin/jinka.js', '--help'], { encoding: 'utf8', timeout: 5000 }).stdout.replace(/\s+/g, ' '),
      containsString('runs again (default: 60000)')
    );
  });
  it('prints the version', () => {
    assertThat(
      'version was not printed',
      spawnSync(process.execPath, ['bin/jinka.js', '--version'], { encoding: 'utf8', timeout: 5000 }).status,
      equalTo(0)
    );
  });
  it('rejects an unknown option without a stack trace', () => {
    assertThat(
      'unknown option produced a stack trace',
      spawnSync(process.execPath, ['bin/jinka.js', `--${randomUUID()}`], { encoding: 'utf8', timeout: 5000 }).stderr,
      not(containsString('    at '))
    );
  });
  it('rejects a non-integer number of threads', () => {
    assertThat(
      'non-integer threads were accepted',
      spawnSync(process.execPath, ['bin/jinka.js', '--threads', '2.5'], { encoding: 'utf8', timeout: 5000 }).status,
      equalTo(1)
    );
  });
  it('rejects more than sixteen threads', () => {
    assertThat(
      'too many threads were accepted',
      spawnSync(process.execPath, ['bin/jinka.js', '--threads', '17'], { encoding: 'utf8', timeout: 5000 }).status,
      equalTo(1)
    );
  });
});
