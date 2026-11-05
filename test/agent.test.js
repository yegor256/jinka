// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { text } from 'node:stream/consumers';
import { randomUUID } from 'node:crypto';
import { assertThat, containsString, not } from 'hamjest';
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
});
