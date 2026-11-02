// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { assertThat, equalTo, matchesPattern, not } from 'hamjest';
import { Genie } from '../src/genie.js';
import { Claude } from '../src/claude.js';
import { Agent } from '../src/agent.js';
import { Disk } from '../src/disk.js';
import { Wish } from '../src/wish.js';
import { Row } from '../src/row.js';

describe('Claude with the real agent', function () {
  this.timeout(300_000);
  before(function () {
    if (spawnSync('claude', ['--version'], { timeout: 30_000, shell: process.platform === 'win32' }).status !== 0) {
      this.skip();
    }
  });
  it('makes a trivial wish come true', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'a.md'), 'Reply with the single word "done", without using any tools.');
    assertThat(
      'the real agent did not finish cleanly',
      (await new Genie(new Claude(new Agent('claude'), '', 'low', join(import.meta.dirname, '..', 'plugin')), new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), { add: () => {} }).run(new Wish(dir, 'a.md', new Map()), new Row([], 0), AbortSignal.timeout(240_000))).code,
      equalTo(0)
    );
  });
  it('summarizes the work of the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'b.md'), 'Reply with the single word "done", without using any tools.');
    assertThat(
      'the real agent gave no summary',
      (await new Genie(new Claude(new Agent('claude'), '', 'low', join(import.meta.dirname, '..', 'plugin')), new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), { add: () => {} }).run(new Wish(dir, 'b.md', new Map()), new Row([], 0), AbortSignal.timeout(240_000))).summary,
      matchesPattern(/done/i)
    );
  });
  it('counts the tokens of the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'c.md'), 'Reply with the single word "done", without using any tools.');
    assertThat(
      'the real agent spent no tokens',
      (await new Genie(new Claude(new Agent('claude'), '', 'low', join(import.meta.dirname, '..', 'plugin')), new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), { add: () => {} }).run(new Wish(dir, 'c.md', new Map()), new Row([], 0), AbortSignal.timeout(240_000))).tokens,
      not(equalTo('0'))
    );
  });
});
