// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { text } from 'node:stream/consumers';
import { randomUUID } from 'node:crypto';
import { assertThat, containsString, equalTo, not } from 'hamjest';
import { Claude } from '../src/claude.js';
import { Agent } from '../src/agent.js';
import { Script } from './fixtures/script.js';

describe('Claude', () => {
  it('passes the arguments to the agent', async () => {
    const arg = randomUUID();
    const child = new Claude(new Agent(await new Script(0).path()), '', '', '/plugin').start([arg], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('argument did not reach the agent', await text(child.stdout), containsString(arg));
  });
  it('starts the agent in headless mode', async () => {
    const child = new Claude(new Agent(await new Script(0).path()), '', '', '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('agent was not headless', await text(child.stdout), containsString('-p --output-format stream-json'));
  });
  it('skips the permission prompts', async () => {
    const child = new Claude(new Agent(await new Script(0).path()), '', '', '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('permission prompts were not skipped', await text(child.stdout), containsString('--dangerously-skip-permissions'));
  });
  it('loads the plugin with skills', async () => {
    const plugin = `/${randomUUID()}`;
    const child = new Claude(new Agent(await new Script(0).path()), '', '', plugin).start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('plugin was not loaded', await text(child.stdout), containsString(`--plugin-dir ${plugin}`));
  });
  it('passes the model verbatim', async () => {
    const model = `claude-${randomUUID()}`;
    const child = new Claude(new Agent(await new Script(0).path()), model, '', '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('model did not reach the agent', await text(child.stdout), containsString(`--model ${model}`));
  });
  it('omits the model when none is given', async () => {
    const child = new Claude(new Agent(await new Script(0).path()), '', '', '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('model was passed without being given', await text(child.stdout), not(containsString('--model')));
  });
  it('passes the effort verbatim', async () => {
    const effort = randomUUID();
    const child = new Claude(new Agent(await new Script(0).path()), '', effort, '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('effort did not reach the agent', await text(child.stdout), containsString(`--effort ${effort}`));
  });
  it('omits the effort when none is given', async () => {
    const child = new Claude(new Agent(await new Script(0).path()), '', '', '/plugin').start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('effort was passed without being given', await text(child.stdout), not(containsString('--effort')));
  });
  it('adds no lines to the prompt', () => {
    assertThat('lines were added to the prompt', new Claude(new Agent(randomUUID()), '', '', `/${randomUUID()}`).lines(), equalTo([]));
  });
});
