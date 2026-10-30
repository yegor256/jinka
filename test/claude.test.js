// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, hasItem, containsString, not, promiseThat, rejected } from 'hamjest';
import { Claude } from '../src/claude.js';
import { Wish } from '../src/wish.js';
import { Row } from '../src/row.js';
import { Script } from './fixtures/script.js';

describe('Claude', () => {
  it('returns the exit code of the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const code = 1 + Math.floor(Math.random() * 100);
    await writeFile(join(dir, 'a.md'), randomUUID());
    assertThat(
      'exit code was lost',
      await new Claude(await new Script(code).path(), '/plugin', dir, '').run(new Wish(dir, 'a.md', new Map()), new Row([], 0), AbortSignal.timeout(5000)),
      equalTo(code)
    );
  });
  it('sends the wish text to the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = `Make me happy ${randomUUID()}`;
    const lines = [];
    await writeFile(join(dir, 'b.md'), text);
    await new Claude(await new Script(0).path(), '/plugin', dir, '').run(new Wish(dir, 'b.md', new Map()), new Row(lines, 3), AbortSignal.timeout(5000));
    assertThat('wish text did not reach the agent', lines, hasItem(equalTo([3, text])));
  });
  it('tells the agent where the wishes live', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await writeFile(join(dir, 'c.md'), randomUUID());
    await new Claude(await new Script(0).path(), '/plugin', dir, '').run(new Wish(dir, 'c.md', new Map()), new Row(lines, 0), AbortSignal.timeout(5000));
    assertThat('wishes directory was not mentioned', lines.map((l) => l[1]).join('\n'), containsString(dir));
  });
  it('loads the plugin with skills', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const plugin = `/${randomUUID()}`;
    const lines = [];
    await writeFile(join(dir, 'd.md'), randomUUID());
    await new Claude(await new Script(0).path(), plugin, dir, '').run(new Wish(dir, 'd.md', new Map()), new Row(lines, 0), AbortSignal.timeout(5000));
    assertThat('plugin was not loaded', lines.map((l) => l[1]).join('\n'), containsString(`--plugin-dir ${plugin}`));
  });
  it('passes the model to the agent verbatim', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const model = `claude-${randomUUID()}`;
    const lines = [];
    await writeFile(join(dir, 'g.md'), randomUUID());
    await new Claude(await new Script(0).path(), '/plugin', dir, model).run(new Wish(dir, 'g.md', new Map()), new Row(lines, 0), AbortSignal.timeout(5000));
    assertThat('model did not reach the agent', lines.map((l) => l[1]).join('\n'), containsString(`--model ${model}`));
  });
  it('omits the model when none is given', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await writeFile(join(dir, 'h.md'), randomUUID());
    await new Claude(await new Script(0).path(), '/plugin', dir, '').run(new Wish(dir, 'h.md', new Map()), new Row(lines, 0), AbortSignal.timeout(5000));
    assertThat('model was passed without being given', lines.map((l) => l[1]).join('\n'), not(containsString('--model')));
  });
  it('stops the agent when the signal aborts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'e.md'), randomUUID());
    assertThat(
      'agent was not stopped',
      await new Claude(await new Script(0, 10000).path(), '/plugin', dir, '').run(new Wish(dir, 'e.md', new Map()), new Row([], 0), AbortSignal.timeout(300)),
      not(equalTo(0))
    );
  });
  it('fails when the agent cannot start', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'f.md'), randomUUID());
    await promiseThat(
      'missing agent did not fail',
      new Claude(join(dir, 'absent'), '/plugin', dir, '').run(new Wish(dir, 'f.md', new Map()), new Row([], 0), AbortSignal.timeout(5000)),
      rejected()
    );
  });
});
