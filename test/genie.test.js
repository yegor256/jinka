// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { stripVTControlCharacters } from 'node:util';
import { mkdtemp, mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, empty, hasItem, containsString, matchesPattern, not, promiseThat, rejected } from 'hamjest';
import { genie } from '../src/genie.js';
import { model } from '../src/model.js';
import { claude } from '../src/claude.js';
import { agent } from '../src/agent.js';
import { disk } from '../src/disk.js';
import { temp } from '../src/temp.js';
import { wish } from '../src/wish.js';
import { permanent } from '../src/permanent.js';
import { row } from '../src/row.js';
import { script } from './fixtures/script.js';

describe('genie', () => {
  it('returns the exit code of the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const code = 1 + Math.floor(Math.random() * 100);
    await writeFile(join(dir, 'a.md'), randomUUID());
    assertThat(
      'exit code was lost',
      (await genie(claude(agent(await script(code).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'a.md', new Map()), row([], 0), AbortSignal.timeout(5000))).code,
      equalTo(code)
    );
  });
  it('returns the first line of the final result of the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const code = 1 + Math.floor(Math.random() * 100);
    await writeFile(join(dir, 'n.md'), randomUUID());
    assertThat(
      'summary was lost',
      (await genie(claude(agent(await script(code).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'n.md', new Map()), row([], 0), AbortSignal.timeout(5000))).summary,
      equalTo(`Finished with code ${code}`)
    );
  });
  it('asks the agent to finish with one sentence about what it did', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await writeFile(join(dir, 'o.md'), randomUUID());
    await genie(claude(agent(await script(0).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'o.md', new Map()), row(lines, 0), AbortSignal.timeout(5000));
    assertThat('agent was not asked for a summary', lines.map((l) => l[1]).join('\n'), containsString('single plain sentence'));
  });
  it('asks the agent to finish with a json object', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await writeFile(join(dir, 'p.md'), randomUUID());
    await genie(claude(agent(await script(0).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'p.md', new Map()), row(lines, 0), AbortSignal.timeout(5000));
    assertThat('agent was not asked for json', lines.map((l) => l[1]).join('\n'), containsString('JSON object'));
  });
  it('asks the agent to name the url of the issue or pull request', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await writeFile(join(dir, 'q.md'), randomUUID());
    await genie(claude(agent(await script(0).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'q.md', new Map()), row(lines, 0), AbortSignal.timeout(5000));
    assertThat('agent was not asked for a url', lines.map((l) => l[1]).join('\n'), containsString('URL of the GitHub issue or pull request'));
  });
  it('sends the wish text to the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = `Make me happy ${randomUUID()}`;
    const lines = [];
    await writeFile(join(dir, 'b.md'), text);
    await genie(claude(agent(await script(0).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'b.md', new Map()), row(lines, 3), AbortSignal.timeout(5000));
    assertThat('wish text did not reach the agent', lines, hasItem(equalTo([3, text])));
  });
  it('tells the agent where the wishes live', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const lines = [];
    await writeFile(join(dir, 'c.md'), randomUUID());
    await genie(claude(agent(await script(0).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'c.md', new Map()), row(lines, 0), AbortSignal.timeout(5000));
    assertThat('wishes directory was not mentioned', lines.map((l) => l[1]).join('\n'), containsString(dir));
  });
  it('tells the agent what happens to the wish file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const w = permanent(wish(dir, 'i.md', new Map()));
    const lines = [];
    await writeFile(join(dir, 'i.md'), randomUUID());
    await genie(claude(agent(await script(0).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(w, row(lines, 0), AbortSignal.timeout(5000));
    assertThat('fate of the wish was not told', lines.map((l) => l[1]).join('\n'), containsString(w.fate()));
  });
  it('adds the lines of the engine to the prompt', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const line = `Skills are near ${randomUUID()}`;
    const lines = [];
    const a = agent(await script(0).path());
    await writeFile(join(dir, 'r.md'), randomUUID());
    await genie({ start: (args, signal, dir) => a.start(args, signal, dir), lines: () => [line] }, disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'r.md', new Map()), row(lines, 0), AbortSignal.timeout(5000));
    assertThat('lines of the engine did not reach the agent', lines.map((l) => l[1]).join('\n'), containsString(line));
  });
  it('adds the lines that the engine gives asynchronously', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const line = `Навыки ${randomUUID()}`;
    const lines = [];
    const a = agent(await script(0).path());
    await writeFile(join(dir, 'u.md'), randomUUID());
    await genie({ start: (args, signal, dir) => a.start(args, signal, dir), lines: async () => [line] }, disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'u.md', new Map()), row(lines, 0), AbortSignal.timeout(5000));
    assertThat('asynchronous lines of the engine did not reach the agent', lines.map((l) => l[1]).join('\n'), containsString(line));
  });
  it('saves the output of the agent into the logs', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const logs = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = `Сделай ${randomUUID()}`;
    await writeFile(join(dir, 'j.md'), text);
    await genie(claude(agent(await script(0).path()), '', '', '/plugin'), disk(dir, logs, await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'j.md', new Map()), row([], 0), AbortSignal.timeout(5000));
    assertThat('output was not saved', await readFile(join(logs, (await readdir(logs))[0]), 'utf8'), containsString(text));
  });
  it('saves the error output of the agent into the logs', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const logs = await mkdtemp(join(tmpdir(), 'jinka-'));
    const code = 1 + Math.floor(Math.random() * 100);
    await writeFile(join(dir, 'k.md'), randomUUID());
    await genie(claude(agent(await script(code).path()), '', '', '/plugin'), disk(dir, logs, await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'k.md', new Map()), row([], 0), AbortSignal.timeout(5000));
    assertThat('error output was not saved', await readFile(join(logs, (await readdir(logs))[0]), 'utf8'), containsString(`Exiting with code ${code}`));
  });
  it('names the log after the wish and the start time', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const logs = await mkdtemp(join(tmpdir(), 'jinka-'));
    await mkdir(join(dir, 'deep'));
    await writeFile(join(dir, 'deep', 'fix-the-parser.md'), randomUUID());
    await genie(claude(agent(await script(0).path()), '', '', '/plugin'), disk(dir, logs, await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, join('deep', 'fix-the-parser.md'), new Map()), row([], 0), AbortSignal.timeout(5000));
    assertThat('log was misnamed', (await readdir(logs, { recursive: true })).join(' '), matchesPattern(/deep[\\/]fix-the-parser-\d{8}-\d{6}\.jsonl/));
  });
  it('returns the tokens spent by the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'p.md'), randomUUID());
    assertThat(
      'tokens were lost',
      (await genie(claude(agent(await script(0, 0, [JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { input_tokens: 4170, output_tokens: 328 } } })]).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'p.md', new Map()), row([], 0), AbortSignal.timeout(5000))).tokens,
      equalTo('4.5K')
    );
  });
  it('returns the model used by the agent', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'q.md'), randomUUID());
    assertThat(
      'model was lost',
      (await genie(claude(agent(await script(0, 0, [JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-opus-4-1-20250805' })]).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'q.md', new Map()), row([], 0), AbortSignal.timeout(5000))).model,
      equalTo('Opus4.1')
    );
  });
  it('returns the model named by the given parser', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `gpt-${randomUUID()}`;
    await writeFile(join(dir, 'z.md'), randomUUID());
    assertThat(
      'model of the parser was lost',
      (await genie(claude(agent(await script(0).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, () => ({ add: () => {}, text: () => name })).run(wish(dir, 'z.md', new Map()), row([], 0), AbortSignal.timeout(5000))).model,
      equalTo(name)
    );
  });
  it('reports every line of the agent to the tokens', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const text = `Count me ${randomUUID()}`;
    const seen = [];
    await writeFile(join(dir, 'm.md'), text);
    await genie(claude(agent(await script(0).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: (line) => seen.push(line) }, model).run(wish(dir, 'm.md', new Map()), row([], 0), AbortSignal.timeout(5000));
    assertThat('lines did not reach the tokens', seen.join('\n'), containsString(text));
  });
  it('shows the length of the agent log next to a shell command', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const count = 2 + Math.floor(Math.random() * 30);
    const lines = [];
    await writeFile(join(dir, 'r.md'), randomUUID());
    await genie(claude(agent(await script(0, 0, [...Array.from({ length: count - 1 }, () => JSON.stringify({ type: 'system', subtype: randomUUID() })), JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'gfind . -name ж' } }] } })]).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'r.md', new Map()), row(lines, 0), AbortSignal.timeout(5000));
    assertThat('length of the log was not shown', lines.map((l) => stripVTControlCharacters(l[1])), hasItem(equalTo(`gfind (${count} lines)`)));
  });
  it('counts the error output of the agent in the length of the log', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const count = 1 + Math.floor(Math.random() * 30);
    const lines = [];
    await writeFile(join(dir, 's.md'), randomUUID());
    await genie(claude(agent(await script(0, 0, [JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'gsed -n 1p ж' } }] } })], 'agent', Array.from({ length: count }, () => `warning ${randomUUID()}`)).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 's.md', new Map()), row(lines, 0), AbortSignal.timeout(5000));
    assertThat('error output was not counted', lines.map((l) => stripVTControlCharacters(l[1])), hasItem(equalTo(`gsed (${count + 1} lines)`)));
  });
  it('stops the agent when the signal aborts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'e.md'), randomUUID());
    assertThat(
      'agent was not stopped',
      (await genie(claude(agent(await script(0, 10000).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'e.md', new Map()), row([], 0), AbortSignal.timeout(300))).code,
      not(equalTo(0))
    );
  });
  it('fails when the agent cannot start', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'f.md'), randomUUID());
    await promiseThat(
      'missing agent did not fail',
      genie(claude(agent(join(dir, 'absent')), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(await mkdtemp(join(tmpdir(), 'jinka-'))), { add: () => {} }, model).run(wish(dir, 'f.md', new Map()), row([], 0), AbortSignal.timeout(5000)),
      rejected()
    );
  });
  it('starts the agent inside a directory under the temporary folder', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const base = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID());
    const seen = [];
    const a = agent(await script(0).path());
    await writeFile(join(dir, 'v.md'), randomUUID());
    await genie({ start: (args, signal, cwd) => seen.push(dirname(cwd)) && a.start(args, signal, cwd), lines: () => [] }, disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(base), { add: () => {} }, model).run(wish(dir, 'v.md', new Map()), row([], 0), AbortSignal.timeout(5000));
    assertThat('agent did not start under the temporary folder', seen, equalTo([base]));
  });
  it('tells the agent to keep its temporary files in its own directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const base = join(await mkdtemp(join(tmpdir(), 'jinka-')), randomUUID());
    const lines = [];
    await writeFile(join(dir, 'w.md'), randomUUID());
    await genie(claude(agent(await script(0).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(base), { add: () => {} }, model).run(wish(dir, 'w.md', new Map()), row(lines, 0), AbortSignal.timeout(5000));
    assertThat('temporary directory was not mentioned', lines.map((l) => l[1]).join('\n'), containsString(join(base, 'w-')));
  });
  it('deletes the temporary directory after the agent succeeds', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const base = await mkdtemp(join(tmpdir(), 'jinka-'));
    const a = agent(await script(0).path());
    await writeFile(join(dir, 'x.md'), randomUUID());
    await genie({ start: (args, signal, cwd) => writeFileSync(join(cwd, `${randomUUID()}.txt`), randomUUID()) ?? a.start(args, signal, cwd), lines: () => [] }, disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(base), { add: () => {} }, model).run(wish(dir, 'x.md', new Map()), row([], 0), AbortSignal.timeout(5000));
    assertThat('temporary directory was left after success', await readdir(base), empty());
  });
  it('deletes the temporary directory after the agent fails', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const base = await mkdtemp(join(tmpdir(), 'jinka-'));
    const a = agent(await script(1 + Math.floor(Math.random() * 100)).path());
    await writeFile(join(dir, 'y.md'), randomUUID());
    await genie({ start: (args, signal, cwd) => writeFileSync(join(cwd, `${randomUUID()}.txt`), randomUUID()) ?? a.start(args, signal, cwd), lines: () => [] }, disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(base), { add: () => {} }, model).run(wish(dir, 'y.md', new Map()), row([], 0), AbortSignal.timeout(5000));
    assertThat('temporary directory was left after failure', await readdir(base), empty());
  });
  it('deletes the temporary directory after the agent is aborted', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const base = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'z.md'), randomUUID());
    await genie(claude(agent(await script(0, 10000).path()), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(base), { add: () => {} }, model).run(wish(dir, 'z.md', new Map()), row([], 0), AbortSignal.timeout(300));
    assertThat('temporary directory was left after abort', await readdir(base), empty());
  });
  it('deletes the temporary directory when the agent cannot start', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const base = await mkdtemp(join(tmpdir(), 'jinka-'));
    await writeFile(join(dir, 'g.md'), randomUUID());
    await genie(claude(agent(join(dir, 'absent')), '', '', '/plugin'), disk(dir, await mkdtemp(join(tmpdir(), 'jinka-')), await mkdtemp(join(tmpdir(), 'jinka-')), { size: () => 1 }), temp(base), { add: () => {} }, model).run(wish(dir, 'g.md', new Map()), row([], 0), AbortSignal.timeout(5000)).catch(() => {});
    assertThat('temporary directory was left after a failed start', await readdir(base), empty());
  });
});
