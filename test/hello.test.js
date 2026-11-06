// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { assertThat, hasItem, equalTo, containsString, promiseThat, rejected } from 'hamjest';
import { hello } from '../src/hello.js';
import { claude } from '../src/claude.js';
import { agent } from '../src/agent.js';
import { protocol } from '../src/protocol.js';
import { script } from './fixtures/script.js';

describe('hello', () => {
  it('prints the answer of the agent in the protocol', async () => {
    const answer = `Я агент ${randomUUID()}`;
    const lines = [];
    await hello(
      { start: () => spawn(process.execPath, ['-e', `process.stdin.resume().on('end', () => console.log(JSON.stringify({ type: 'result', result: ${JSON.stringify(answer)} })))`]) },
      protocol(lines)
    ).run(AbortSignal.timeout(5000));
    assertThat('answer of the agent was not printed', lines, hasItem(equalTo(['info', `the agent says: ${answer}`])));
  });
  it('asks the agent who it is', async () => {
    const lines = [];
    await hello(
      { start: () => spawn(process.execPath, ['-e', "let i = ''; process.stdin.on('data', (d) => { i += d; }).on('end', () => console.log(JSON.stringify({ type: 'result', result: i })))"]) },
      protocol(lines)
    ).run(AbortSignal.timeout(5000));
    assertThat('agent was not asked who it is', lines.map((l) => l[1]).join('\n'), containsString('Tell me, who you are, in a very short single sentence.'));
  });
  it('rejects when the agent exits with a non-zero code', async () => {
    await promiseThat(
      hello(claude(agent(await script(1 + Math.floor(Math.random() * 100)).path()), '', '', '/plugin'), protocol([])).run(AbortSignal.timeout(5000)),
      rejected()
    );
  });
  it('rejects when the agent cannot start', async () => {
    await promiseThat(
      hello(claude(agent(`/${randomUUID()}`), '', '', '/plugin'), protocol([])).run(AbortSignal.timeout(5000)),
      rejected()
    );
  });
});
