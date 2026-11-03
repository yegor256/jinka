// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { assertThat, equalTo, containsString, startsWith } from 'hamjest';
import { Summary } from '../src/summary.js';
import { Jobs } from '../src/jobs.js';

describe('Summary', () => {
  it('starts with a separator line', () => {
    assertThat('summary does not start with a separator', new Summary(Date.now(), '1.2.3', new Jobs({ run: async () => ({ code: 0 }) }), { agent: 'claude', model: 'opus', effort: 'high', wishes: join(tmpdir(), randomUUID()) }).text(), startsWith('---\n'));
  });
  it('shows the version and how long jinka worked', () => {
    const version = randomUUID();
    assertThat('version and duration are not shown', new Summary(Date.now() - 3_725_000, version, new Jobs({ run: async () => ({ code: 0 }) }), { agent: 'claude', model: 'opus', effort: 'high', wishes: join(tmpdir(), randomUUID()) }).text(), containsString(`\njinka ${version} finished in 01:02:05\n`));
  });
  it('shows the agent, the model, and the effort', () => {
    const agent = randomUUID();
    assertThat('agent settings are not shown', new Summary(Date.now(), '0.0.1', new Jobs({ run: async () => ({ code: 0 }) }), { agent, model: 'sonnet', effort: 'xhigh', wishes: join(tmpdir(), randomUUID()) }).text(), containsString(`\nagent: ${agent}, model: sonnet, effort: xhigh\n`));
  });
  it('shows the defaults when no model and no effort are chosen', () => {
    assertThat('defaults are not shown', new Summary(Date.now(), '0.0.2', new Jobs({ run: async () => ({ code: 0 }) }), { agent: 'codex', model: '', effort: '', wishes: join(tmpdir(), randomUUID()) }).text(), containsString('\nagent: codex, model: default, effort: default\n'));
  });
  it('shows how many sessions finished', async () => {
    const jobs = new Jobs({ run: async () => ({ code: 0 }) });
    await jobs.run({}, { show: () => {} }, AbortSignal.timeout(1000));
    await jobs.run({}, { show: () => {} }, AbortSignal.timeout(1000));
    assertThat('finished sessions are not shown', new Summary(Date.now(), '0.0.3', jobs, { agent: 'claude', model: 'haiku', effort: 'low', wishes: join(tmpdir(), randomUUID()) }).text(), containsString('\nsessions finished: 2\n'));
  });
  it('counts the wishes that remained in the directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await mkdir(join(dir, 'deep'));
    await writeFile(join(dir, 'a.md'), 'first');
    await writeFile(join(dir, 'deep', 'b.md'), 'second');
    await writeFile(join(dir, 'c.txt'), 'third');
    assertThat('remaining wishes are not counted', new Summary(Date.now(), '0.0.4', new Jobs({ run: async () => ({ code: 0 }) }), { agent: 'claude', model: 'opus', effort: 'max', wishes: dir }).text(), equalTo(`---\njinka 0.0.4 finished in 00:00:00\nagent: claude, model: opus, effort: max\nsessions finished: 0\nwishes remained in ${dir}: 2\n`));
  });
  it('counts no wishes when the directory is absent', () => {
    const dir = join(tmpdir(), randomUUID());
    assertThat('absent directory is not empty', new Summary(Date.now(), '0.0.5', new Jobs({ run: async () => ({ code: 0 }) }), { agent: 'claude', model: 'opus', effort: 'max', wishes: dir }).text(), containsString(`\nwishes remained in ${dir}: 0\n`));
  });
  it('shortens the home directory to a tilde', () => {
    const name = randomUUID();
    assertThat('home directory is not shortened', new Summary(Date.now(), '0.0.6', new Jobs({ run: async () => ({ code: 0 }) }), { agent: 'claude', model: 'opus', effort: 'max', wishes: join(homedir(), name) }).text(), containsString(`\nwishes remained in ${join('~', name)}: 0\n`));
  });
});
