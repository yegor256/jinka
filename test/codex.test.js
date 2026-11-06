// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { text } from 'node:stream/consumers';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { assertThat, containsString, endsWith, equalTo, not } from 'hamjest';
import { codex } from '../src/codex.js';
import { agent } from '../src/agent.js';
import { script } from './fixtures/script.js';

describe('codex', () => {
  it('passes the arguments to the agent', async () => {
    const arg = randomUUID();
    const child = codex(agent(await script(0).path()), '', '', '/plugin').start([arg], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('argument did not reach the agent', await text(child.stdout), containsString(arg));
  });
  it('starts the agent in headless mode with events in JSON', async () => {
    const child = codex(agent(await script(0).path()), '', '', '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('agent was not headless', await text(child.stdout), containsString('exec --json'));
  });
  it('skips the approvals and the sandbox', async () => {
    const child = codex(agent(await script(0).path()), '', '', '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('approvals were not skipped', await text(child.stdout), containsString('--dangerously-bypass-approvals-and-sandbox'));
  });
  it('runs outside of a Git repository', async () => {
    const child = codex(agent(await script(0).path()), '', '', '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('agent was not allowed outside of Git', await text(child.stdout), containsString('--skip-git-repo-check'));
  });
  it('reads the prompt from the standard input', async () => {
    const child = codex(agent(await script(0).path()), '', '', '/plugin').start([randomUUID()], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('prompt was not read from the standard input', (await text(child.stdout)).split('\n').at(-3), endsWith(' -"}]}}'));
  });
  it('passes the model verbatim', async () => {
    const model = `gpt-${randomUUID()}`;
    const child = codex(agent(await script(0).path()), model, '', '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('model did not reach the agent', await text(child.stdout), containsString(`--model ${model}`));
  });
  it('omits the model when none is given', async () => {
    const child = codex(agent(await script(0).path()), '', '', '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('model was passed without being given', await text(child.stdout), not(containsString('--model')));
  });
  it('passes the effort as the reasoning effort', async () => {
    const effort = randomUUID();
    const child = codex(agent(await script(0).path()), '', effort, '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('effort did not reach the agent', await text(child.stdout), containsString(`--config model_reasoning_effort=${effort}`));
  });
  it('omits the effort when none is given', async () => {
    const child = codex(agent(await script(0).path()), '', '', '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('effort was passed without being given', await text(child.stdout), not(containsString('model_reasoning_effort')));
  });
  it('demands the final answer to match the json schema in a file', async () => {
    const child = codex(agent(await script(0).path()), '', '', `/${randomUUID()}`).start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat(
      'json schema file was not demanded',
      await readFile(JSON.parse((await text(child.stdout)).split('\n').at(-3)).message.content[0].text.match(/--output-schema (\S+)/)[1], 'utf8'),
      containsString('"summary"')
    );
  });
  it('tells the agent where the skills live', () => {
    const plugin = `/${randomUUID()}`;
    assertThat('skills were not mentioned', codex(agent(randomUUID()), '', '', plugin).lines().join('\n'), containsString(join(plugin, 'skills')));
  });
  it('renders the same command line that it starts', async () => {
    const path = await script(0).path();
    const engine = codex(agent(path), randomUUID(), randomUUID(), `/${randomUUID()}`);
    const args = ['--add-dir', `/${randomUUID()}`];
    const child = engine.start(args, AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('command line differs from the one started', engine.command(args), equalTo(`${path} ${JSON.parse((await text(child.stdout)).split('\n').at(-3)).message.content[0].text}`));
  });
});
