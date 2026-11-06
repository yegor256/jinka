// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, containsString, matchesPattern, not } from 'hamjest';
import { script } from './fixtures/script.js';

describe('jinka command', () => {
  it('archives all wishes and exits with code 130 on interrupt', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const archive = await mkdtemp(join(tmpdir(), 'jinka-'));
    const jinka = spawn(
      process.execPath,
      ['bin/jinka.js', '--agent', await script(0).path(), '--threads', '2', '--archive', archive, '--logs', await mkdtemp(join(tmpdir(), 'jinka-')), '--memory', await mkdtemp(join(tmpdir(), 'jinka-')), '--interval', '50', '--pid', join(await mkdtemp(join(tmpdir(), 'jinka-')), 'pid.txt'), '--wishes', dir],
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
      ['bin/jinka.js', '--agent', await script(0).path(), '--threads', '2', '--archive', archive, '--logs', await mkdtemp(join(tmpdir(), 'jinka-')), '--memory', await mkdtemp(join(tmpdir(), 'jinka-')), '--interval', '50', '--pid', join(await mkdtemp(join(tmpdir(), 'jinka-')), 'pid.txt'), '--wishes', dir],
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
      ['bin/jinka.js', '--agent', await script(0).path(), '--interval', '50', '--pid', join(await mkdtemp(join(tmpdir(), 'jinka-')), 'pid.txt'), '--wishes', dir],
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
      ['bin/jinka.js', '--agent', await script(0).path(), '--interval', '50'],
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
  it('loads skills from the directory given in the skill option', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const logs = await mkdtemp(join(tmpdir(), 'jinka-'));
    const archive = await mkdtemp(join(tmpdir(), 'jinka-'));
    const skill = await mkdtemp(join(tmpdir(), 'jinka-'));
    const jinka = spawn(
      process.execPath,
      ['bin/jinka.js', '--agent', await script(0).path(), '--skill', skill, '--archive', archive, '--logs', logs, '--memory', await mkdtemp(join(tmpdir(), 'jinka-')), '--interval', '50', '--pid', join(await mkdtemp(join(tmpdir(), 'jinka-')), 'pid.txt'), '--wishes', dir],
      { stdio: ['pipe', 'ignore', 'ignore'] }
    );
    await setTimeout(500);
    await writeFile(join(dir, 'a.md'), randomUUID());
    const deadline = Date.now() + 8000;
    while ((await readdir(archive)).length < 1 && Date.now() < deadline) {
      await setTimeout(50);
    }
    jinka.stdin.write('\x03');
    await once(jinka, 'exit');
    assertThat(
      'the agent did not load skills from the given directory',
      (await Promise.all((await readdir(logs)).map((f) => readFile(join(logs, f), 'utf8')))).join(''),
      containsString(JSON.stringify(`--plugin-dir ${skill}`).slice(1, -1))
    );
  });
  it('guesses the codex engine from the name of the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const logs = await mkdtemp(join(tmpdir(), 'jinka-'));
    const archive = await mkdtemp(join(tmpdir(), 'jinka-'));
    const jinka = spawn(
      process.execPath,
      ['bin/jinka.js', '--agent', await script(0, 0, [], 'codex').path(), '--archive', archive, '--logs', logs, '--memory', await mkdtemp(join(tmpdir(), 'jinka-')), '--interval', '50', '--pid', join(await mkdtemp(join(tmpdir(), 'jinka-')), 'pid.txt'), '--wishes', dir],
      { stdio: ['pipe', 'ignore', 'ignore'] }
    );
    await setTimeout(500);
    await writeFile(join(dir, 'a.md'), randomUUID());
    const deadline = Date.now() + 8000;
    while ((await readdir(archive)).length < 1 && Date.now() < deadline) {
      await setTimeout(50);
    }
    jinka.stdin.write('\x03');
    await once(jinka, 'exit');
    assertThat(
      'the codex engine was not guessed from the agent name',
      (await Promise.all((await readdir(logs)).map((f) => readFile(join(logs, f), 'utf8')))).join(''),
      containsString('exec --json')
    );
  });
  it('runs the codex engine when it is asked to', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const logs = await mkdtemp(join(tmpdir(), 'jinka-'));
    const archive = await mkdtemp(join(tmpdir(), 'jinka-'));
    const jinka = spawn(
      process.execPath,
      ['bin/jinka.js', '--agent', await script(0).path(), '--engine', 'codex', '--archive', archive, '--logs', logs, '--memory', await mkdtemp(join(tmpdir(), 'jinka-')), '--interval', '50', '--pid', join(await mkdtemp(join(tmpdir(), 'jinka-')), 'pid.txt'), '--wishes', dir],
      { stdio: ['pipe', 'ignore', 'ignore'] }
    );
    await setTimeout(500);
    await writeFile(join(dir, 'a.md'), randomUUID());
    const deadline = Date.now() + 8000;
    while ((await readdir(archive)).length < 1 && Date.now() < deadline) {
      await setTimeout(50);
    }
    jinka.stdin.write('\x03');
    await once(jinka, 'exit');
    assertThat(
      'the codex engine did not run',
      (await Promise.all((await readdir(logs)).map((f) => readFile(join(logs, f), 'utf8')))).join(''),
      containsString('exec --json')
    );
  });
  it('refuses to start when the pid file already exists', async () => {
    const pid = join(await mkdtemp(join(tmpdir(), 'jinka-')), 'pid.txt');
    await writeFile(pid, randomUUID());
    assertThat(
      'jinka started while another one was running',
      spawnSync(process.execPath, ['bin/jinka.js', '--agent', await script(0).path(), '--pid', pid, '--wishes', await mkdtemp(join(tmpdir(), 'jinka-'))], { encoding: 'utf8', timeout: 5000 }).status,
      equalTo(1)
    );
  });
  it('deletes the pid file after an interrupt', async () => {
    const pid = join(await mkdtemp(join(tmpdir(), 'jinka-')), 'pid.txt');
    const jinka = spawn(
      process.execPath,
      ['bin/jinka.js', '--agent', await script(0).path(), '--archive', await mkdtemp(join(tmpdir(), 'jinka-')), '--logs', await mkdtemp(join(tmpdir(), 'jinka-')), '--memory', await mkdtemp(join(tmpdir(), 'jinka-')), '--interval', '50', '--pid', pid, '--wishes', await mkdtemp(join(tmpdir(), 'jinka-'))],
      { stdio: ['pipe', 'ignore', 'ignore'] }
    );
    await setTimeout(500);
    jinka.stdin.write('\x03');
    await Promise.race([once(jinka, 'exit'), setTimeout(5000)]);
    assertThat('pid file was not deleted', await readdir(dirname(pid)), equalTo([]));
  });
  it('prints help with option descriptions', () => {
    assertThat(
      'help did not describe the threads option',
      spawnSync(process.execPath, ['bin/jinka.js', '--help'], { encoding: 'utf8', timeout: 5000 }).stdout,
      containsString('how many wishes run at once')
    );
  });
  it('runs six threads by default', () => {
    assertThat(
      'help did not show six threads by default',
      spawnSync(process.execPath, ['bin/jinka.js', '--help'], { encoding: 'utf8', timeout: 5000 }).stdout.replace(/\s+/g, ' '),
      containsString('while running (default: 6)')
    );
  });
  it('pauses permanent wishes for one minute by default', () => {
    assertThat(
      'help did not show a one minute default pause',
      spawnSync(process.execPath, ['bin/jinka.js', '--help'], { encoding: 'utf8', timeout: 5000 }).stdout.replace(/\s+/g, ' '),
      containsString('runs again (default: 60000)')
    );
  });
  it('offers an option that turns the terminal user interface off', () => {
    assertThat(
      'help did not describe the no-tui option',
      spawnSync(process.execPath, ['bin/jinka.js', '--help'], { encoding: 'utf8', timeout: 5000 }).stdout.replace(/\s+/g, ' '),
      containsString('--no-tui print only the protocol')
    );
  });
  it('prints options in alphabetical order', () => {
    assertThat(
      'help did not sort its options alphabetically',
      spawnSync(process.execPath, ['bin/jinka.js', '--help'], { encoding: 'utf8', timeout: 5000 }).stdout,
      matchesPattern(/--agent[^]*--archive[^]*--effort[^]*--engine[^]*--interval[^]*--limit[^]*--logs[^]*--memory[^]*--model[^]*--no-color[^]*--no-tui[^]*--pause[^]*--pid[^]*--skill[^]*--threads[^]*--throttle[^]*--wishes/)
    );
  });
  it('prints the version at the end of the help description', () => {
    assertThat(
      'help did not end its description with the version',
      spawnSync(process.execPath, ['bin/jinka.js', '--help'], { encoding: 'utf8', timeout: 5000 }).stdout,
      matchesPattern(/coding agents \(\d+\.\d+\.\d+\)\n/)
    );
  });
  it('prints the summary through a slow pipe after an interrupt', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'a.md'), randomUUID());
    const reader = spawn(process.execPath, ['-e', 'setTimeout(() => process.stdin.pipe(process.stdout), 2000)'], { stdio: ['pipe', 'pipe', 'ignore'] });
    const chunks = [];
    reader.stdout.on('data', (c) => chunks.push(c));
    const jinka = spawn(
      process.execPath,
      ['bin/jinka.js', '--agent', await script(1, 0, Array.from({ length: 2000 }, () => JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: randomUUID().repeat(4) }] } }))).path(), '--threads', '1', '--archive', await mkdtemp(join(tmpdir(), 'jinka-')), '--logs', await mkdtemp(join(tmpdir(), 'jinka-')), '--memory', await mkdtemp(join(tmpdir(), 'jinka-')), '--interval', '50', '--pid', join(await mkdtemp(join(tmpdir(), 'jinka-')), 'pid.txt'), '--wishes', dir],
      { stdio: ['pipe', reader.stdin, 'ignore'] }
    );
    reader.stdin.destroy();
    await setTimeout(1500);
    jinka.stdin.write('\x03');
    await Promise.race([once(reader, 'close'), setTimeout(6000)]);
    assertThat('summary was lost in the pipe', Buffer.concat(chunks).toString(), containsString('\nwishes came true: 0\n'));
  });
  it('prints the command line of the agent at startup', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'a.md'), randomUUID());
    const model = randomUUID();
    assertThat(
      'command line of the agent was not printed',
      spawnSync(
        process.execPath,
        ['bin/jinka.js', '--agent', await script(0).path(), '--model', model, '--limit', '1', '--archive', await mkdtemp(join(tmpdir(), 'jinka-')), '--logs', await mkdtemp(join(tmpdir(), 'jinka-')), '--memory', await mkdtemp(join(tmpdir(), 'jinka-')), '--interval', '50', '--pid', join(await mkdtemp(join(tmpdir(), 'jinka-')), 'pid.txt'), '--wishes', dir],
        { encoding: 'utf8', timeout: 10000 }
      ).stdout,
      matchesPattern(new RegExp(`every agent starts as: .+ --model ${model}\\n`))
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
