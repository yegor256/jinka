// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { text } from 'node:stream/consumers';
import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, containsString, equalTo, not } from 'hamjest';
import { agent } from '../src/agent.js';
import { script } from './fixtures/script.js';

describe('agent', () => {
  it('passes the arguments to the executable', async () => {
    const arg = randomUUID();
    const child = agent(await script(0).path()).start([arg], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('argument did not reach the agent', await text(child.stdout), containsString(arg));
  });
  it('adds no arguments of its own', async () => {
    const child = agent(await script(0).path()).start([], AbortSignal.timeout(5000));
    child.stdin.end();
    assertThat('agent added its own arguments', await text(child.stdout), not(containsString('--')));
  });
  it('runs the executable inside the given directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const name = `${randomUUID()}.txt`;
    const child = agent(process.execPath).start(['-e', `require('fs').writeFileSync(${JSON.stringify(name)}, '')`], AbortSignal.timeout(5000), dir);
    await new Promise((resolve) => child.on('close', resolve));
    assertThat('agent did not run inside the given directory', await readdir(dir), equalTo([name]));
  });
  it('renders the command with the executable first', () => {
    const command = `/${randomUUID()}`;
    const arg = randomUUID();
    assertThat('command was not rendered', agent(command).command(['-p', arg]), equalTo(`${command} -p ${arg}`));
  });
  it('quotes the arguments with spaces in the command', () => {
    const arg = `${randomUUID()} ${randomUUID()}`;
    assertThat('argument with spaces was not quoted', agent('x').command([arg]), equalTo(`x '${arg}'`));
  });
  it('leaves the backslashes of a Windows path unquoted in the command', () => {
    const command = `C:\\RUNNER~1\\${randomUUID()}\\agent.cmd`;
    assertThat('Windows path was quoted', agent(command).command([]), equalTo(command));
  });
});
