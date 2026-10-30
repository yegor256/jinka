// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, hasItem, containsString, matchesPattern, not, promiseThat, rejected } from 'hamjest';
import { Claude } from '../src/claude.js';
import { Agent } from '../src/agent.js';
import { Disk } from '../src/disk.js';
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
      (await new Claude(new Agent(await new Script(code).path(), ''), '/plugin', new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'a.md', new Map()), new Row([], 0), AbortSignal.timeout(5000))).code,
      equalTo(code)
    );
  });
  it('returns the first line of the final result of the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const code = 1 + Math.floor(Math.random() * 100);
    await writeFile(join(dir, 'n.md'), randomUUID());
    assertThat(
      'summary was lost',
      (await new Claude(new Agent(await new Script(code).path(), ''), '/plugin', new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'n.md', new Map()), new Row([], 0), AbortSignal.timeout(5000))).summary,
      equalTo(`Finished with code ${code}`)
    );
  });
  it('asks the agent to finish with one sentence about what it did', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await writeFile(join(dir, 'o.md'), randomUUID());
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'o.md', new Map()), new Row(lines, 0), AbortSignal.timeout(5000));
    assertThat('agent was not asked for a summary', lines.map((l) => l[1]).join('\n'), containsString('single plain sentence'));
  });
  it('asks the agent to name the url of the issue or pull request', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await writeFile(join(dir, 'q.md'), randomUUID());
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'q.md', new Map()), new Row(lines, 0), AbortSignal.timeout(5000));
    assertThat('agent was not asked for a url', lines.map((l) => l[1]).join('\n'), containsString('URL of the GitHub issue or pull request'));
  });
  it('sends the wish text to the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = `Make me happy ${randomUUID()}`;
    const lines = [];
    await writeFile(join(dir, 'b.md'), text);
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'b.md', new Map()), new Row(lines, 3), AbortSignal.timeout(5000));
    assertThat('wish text did not reach the agent', lines, hasItem(equalTo([3, text])));
  });
  it('tells the agent where the wishes live', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await writeFile(join(dir, 'c.md'), randomUUID());
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'c.md', new Map()), new Row(lines, 0), AbortSignal.timeout(5000));
    assertThat('wishes directory was not mentioned', lines.map((l) => l[1]).join('\n'), containsString(dir));
  });
  it('tells the agent what happens to the wish file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const wish = new Permanent(new Wish(dir, 'i.md', new Map()));
    const lines = [];
    await writeFile(join(dir, 'i.md'), randomUUID());
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(wish, new Row(lines, 0), AbortSignal.timeout(5000));
    assertThat('fate of the wish was not told', lines.map((l) => l[1]).join('\n'), containsString(wish.fate()));
  });
  it('loads the plugin with skills', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const plugin = `/${randomUUID()}`;
    const lines = [];
    await writeFile(join(dir, 'd.md'), randomUUID());
    await new Claude(new Agent(await new Script(0).path(), ''), plugin, new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'd.md', new Map()), new Row(lines, 0), AbortSignal.timeout(5000));
    assertThat('plugin was not loaded', lines.map((l) => l[1]).join('\n'), containsString(`--plugin-dir ${plugin}`));
  });
  it('saves the output of the agent into the logs', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const logs = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = `Сделай ${randomUUID()}`;
    await writeFile(join(dir, 'j.md'), text);
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', new Disk(dir, logs, await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'j.md', new Map()), new Row([], 0), AbortSignal.timeout(5000));
    assertThat('output was not saved', await readFile(join(logs, (await readdir(logs))[0]), 'utf8'), containsString(text));
  });
  it('saves the error output of the agent into the logs', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const logs = await mkdtemp(join(tmpdir(), 'jinka-'));
    const code = 1 + Math.floor(Math.random() * 100);
    await writeFile(join(dir, 'k.md'), randomUUID());
    await new Claude(new Agent(await new Script(code).path(), ''), '/plugin', new Disk(dir, logs, await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'k.md', new Map()), new Row([], 0), AbortSignal.timeout(5000));
    assertThat('error output was not saved', await readFile(join(logs, (await readdir(logs))[0]), 'utf8'), containsString(`Exiting with code ${code}`));
  });
  it('names the log after the wish and the start time', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const logs = await mkdtemp(join(tmpdir(), 'jinka-'));
    await mkdir(join(dir, 'deep'));
    await writeFile(join(dir, 'deep', 'fix-the-parser.md'), randomUUID());
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', new Disk(dir, logs, await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, join('deep', 'fix-the-parser.md'), new Map()), new Row([], 0), AbortSignal.timeout(5000));
    assertThat('log was misnamed', (await readdir(logs, { recursive: true })).join(' '), matchesPattern(/deep[\\/]fix-the-parser-\d{8}-\d{6}\.jsonl/));
  });
  it('returns the tokens spent by the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'p.md'), randomUUID());
    assertThat(
      'tokens were lost',
      (await new Claude(new Agent(await new Script(0, 0, [JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { input_tokens: 4170, output_tokens: 328 } } })]).path(), ''), '/plugin', new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'p.md', new Map()), new Row([], 0), AbortSignal.timeout(5000))).tokens,
      equalTo('4.5K')
    );
  });
  it('returns the model used by the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'q.md'), randomUUID());
    assertThat(
      'model was lost',
      (await new Claude(new Agent(await new Script(0, 0, [JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-opus-4-1-20250805' })]).path(), ''), '/plugin', new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'q.md', new Map()), new Row([], 0), AbortSignal.timeout(5000))).model,
      equalTo('Opus4.1')
    );
  });
  it('reports every line of the agent to the tokens', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = `Count me ${randomUUID()}`;
    const seen = [];
    await writeFile(join(dir, 'm.md'), text);
    await new Claude(new Agent(await new Script(0).path(), ''), '/plugin', new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: (line) => seen.push(line) }).run(new Wish(dir, 'm.md', new Map()), new Row([], 0), AbortSignal.timeout(5000));
    assertThat('lines did not reach the tokens', seen.join('\n'), containsString(text));
  });
  it('stops the agent when the signal aborts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'e.md'), randomUUID());
    assertThat(
      'agent was not stopped',
      (await new Claude(new Agent(await new Script(0, 10000).path(), ''), '/plugin', new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'e.md', new Map()), new Row([], 0), AbortSignal.timeout(300))).code,
      not(equalTo(0))
    );
  });
  it('fails when the agent cannot start', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'f.md'), randomUUID());
    await promiseThat(
      'missing agent did not fail',
      new Claude(new Agent(join(dir, 'absent'), ''), '/plugin', new Disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }).run(new Wish(dir, 'f.md', new Map()), new Row([], 0), AbortSignal.timeout(5000)),
      rejected()
    );
  });
});
