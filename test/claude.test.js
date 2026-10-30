// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, hasItem, containsString, matchesPattern, not, promiseThat, rejected } from 'hamjest';
import { Claude } from '../src/claude.js';
import { Agent } from '../src/agent.js';
import { Wish } from '../src/wish.js';
import { Permanent } from '../src/permanent.js';
import { Row } from '../src/row.js';
import { Script } from './fixtures/script.js';

describe('Claude', () => {
  it('returns the exit code of the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const code = 1 + Math.floor(Math.random() * 100);
    await writeFile(join(dir, 'a.md'), randomUUID());
    assertThat(
      'exit code was lost',
      await new Claude(new Agent(await new Script(code).path(), ''), '/plugin', dir, await mkdtemp(join(tmpdir(), 'jinka-'))).run(new Wish(dir, 'a.md', new Map()), new Row([], 0), AbortSignal.timeout(5000)),
      equalTo(code)
    );
  });
  it('sends the wish text to the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = `Make me happy ${randomUUID()}`;
    const lines = [];
    await writeFile(join(dir, 'b.md'), text);
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', dir, await mkdtemp(join(tmpdir(), 'jinka-'))).run(new Wish(dir, 'b.md', new Map()), new Row(lines, 3), AbortSignal.timeout(5000));
    assertThat('wish text did not reach the agent', lines, hasItem(equalTo([3, text])));
  });
  it('tells the agent where the wishes live', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await writeFile(join(dir, 'c.md'), randomUUID());
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', dir, await mkdtemp(join(tmpdir(), 'jinka-'))).run(new Wish(dir, 'c.md', new Map()), new Row(lines, 0), AbortSignal.timeout(5000));
    assertThat('wishes directory was not mentioned', lines.map((l) => l[1]).join('\n'), containsString(dir));
  });
  it('tells the agent what happens to the wish file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const wish = new Permanent(new Wish(dir, 'i.md', new Map()));
    const lines = [];
    await writeFile(join(dir, 'i.md'), randomUUID());
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', dir, await mkdtemp(join(tmpdir(), 'jinka-'))).run(wish, new Row(lines, 0), AbortSignal.timeout(5000));
    assertThat('fate of the wish was not told', lines.map((l) => l[1]).join('\n'), containsString(wish.fate()));
  });
  it('loads the plugin with skills', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const plugin = `/${randomUUID()}`;
    const lines = [];
    await writeFile(join(dir, 'd.md'), randomUUID());
    await new Claude(new Agent(await new Script(0).path(), ''), plugin, dir, await mkdtemp(join(tmpdir(), 'jinka-'))).run(new Wish(dir, 'd.md', new Map()), new Row(lines, 0), AbortSignal.timeout(5000));
    assertThat('plugin was not loaded', lines.map((l) => l[1]).join('\n'), containsString(`--plugin-dir ${plugin}`));
  });
  it('saves the output of the agent into the logs', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const logs = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = `Сделай ${randomUUID()}`;
    await writeFile(join(dir, 'j.md'), text);
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', dir, logs).run(new Wish(dir, 'j.md', new Map()), new Row([], 0), AbortSignal.timeout(5000));
    assertThat('output was not saved', await readFile(join(logs, (await readdir(logs))[0]), 'utf8'), containsString(text));
  });
  it('saves the error output of the agent into the logs', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const logs = await mkdtemp(join(tmpdir(), 'jinka-'));
    const code = 1 + Math.floor(Math.random() * 100);
    await writeFile(join(dir, 'k.md'), randomUUID());
    await new Claude(new Agent(await new Script(code).path(), ''), '/plugin', dir, logs).run(new Wish(dir, 'k.md', new Map()), new Row([], 0), AbortSignal.timeout(5000));
    assertThat('error output was not saved', await readFile(join(logs, (await readdir(logs))[0]), 'utf8'), containsString(`Exiting with code ${code}`));
  });
  it('names the log after the wish and the start time', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const logs = await mkdtemp(join(tmpdir(), 'jinka-'));
    await mkdir(join(dir, 'deep'));
    await writeFile(join(dir, 'deep', 'fix-the-parser.md'), randomUUID());
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', dir, logs).run(new Wish(dir, join('deep', 'fix-the-parser.md'), new Map()), new Row([], 0), AbortSignal.timeout(5000));
    assertThat('log was misnamed', (await readdir(logs, { recursive: true })).join(' '), matchesPattern(/deep\/fix-the-parser-\d{8}-\d{6}\.jsonl/));
  });
  it('stops the agent when the signal aborts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'e.md'), randomUUID());
    assertThat(
      'agent was not stopped',
      await new Claude(new Agent(await new Script(0, 10000).path(), ''), '/plugin', dir, await mkdtemp(join(tmpdir(), 'jinka-'))).run(new Wish(dir, 'e.md', new Map()), new Row([], 0), AbortSignal.timeout(300)),
      not(equalTo(0))
    );
  });
  it('fails when the agent cannot start', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'f.md'), randomUUID());
    await promiseThat(
      'missing agent did not fail',
      new Claude(new Agent(join(dir, 'absent'), ''), '/plugin', dir, await mkdtemp(join(tmpdir(), 'jinka-'))).run(new Wish(dir, 'f.md', new Map()), new Row([], 0), AbortSignal.timeout(5000)),
      rejected()
    );
  });
});
