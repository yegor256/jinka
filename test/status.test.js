// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { stripVTControlCharacters } from 'node:util';
import { assertThat, startsWith, endsWith, containsString } from 'hamjest';
import { status } from '../src/status.js';
import { tokens } from '../src/tokens.js';
import { quota } from '../src/quota.js';
import { jobs } from '../src/jobs.js';

describe('status', () => {
  it('starts with the uptime', () => {
    assertThat('status line does not start with the uptime', stripVTControlCharacters(status(Date.now() - 3_725_000, jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', tokens(), quota()).text()), startsWith('up:01:02:05 '));
  });
  it('shows the count of done jobs right after the uptime', async () => {
    const j = jobs({ run: async () => ({ code: 0 }) });
    await j.run({}, { show: () => {} }, AbortSignal.timeout(1000));
    await j.run({}, { show: () => {} }, AbortSignal.timeout(1000));
    assertThat('done jobs are not shown', stripVTControlCharacters(status(Date.now() - 61_000, j, 'claude', 'opus', tokens(), quota()).text()), containsString('up:00:01:01 done:2 agent:claude '));
  });
  it('paints the count of done jobs on a dark gray background', () => {
    assertThat('done jobs are not painted dark gray', status(Date.now(), jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', tokens(), quota()).text(), containsString(' done:\x1b[100m0\x1b[49m '));
  });
  it('shows the agent', () => {
    const agent = randomUUID();
    assertThat('agent is not shown', stripVTControlCharacters(status(Date.now(), jobs({ run: async () => ({ code: 0 }) }), agent, 'opus', tokens(), quota()).text()), containsString(` agent:${agent} model:opus `));
  });
  it('paints the agent on a dark gray background', () => {
    const agent = randomUUID();
    assertThat('agent is not painted dark gray', status(Date.now(), jobs({ run: async () => ({ code: 0 }) }), agent, 'opus', tokens(), quota()).text(), containsString(` agent:\x1b[100m${agent}\x1b[49m `));
  });
  it('shows the model of the agents', () => {
    const model = randomUUID();
    assertThat('model is not shown', stripVTControlCharacters(status(Date.now(), jobs({ run: async () => ({ code: 0 }) }), 'claude', model, tokens(), quota()).text()), containsString(` model:${model} `));
  });
  it('shows the default model when none is chosen', () => {
    assertThat('default model is not shown', stripVTControlCharacters(status(Date.now(), jobs({ run: async () => ({ code: 0 }) }), 'claude', '', tokens(), quota()).text()), containsString(' model:default '));
  });
  it('shows the tokens used by the agents', () => {
    const t = tokens();
    t.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 4_721 } } }));
    assertThat('tokens are not shown', stripVTControlCharacters(status(Date.now(), jobs({ run: async () => ({ code: 0 }) }), 'claude', 'haiku', t, quota()).text()), containsString(' tokens:4.7K '));
  });
  it('paints the uptime on a dark gray background', () => {
    assertThat('uptime is not painted dark gray', status(Date.now() - 7_384_000, jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', tokens(), quota()).text(), startsWith('up:\x1b[100m02:03:04\x1b[49m '));
  });
  it('paints the model on a dark gray background', () => {
    const model = randomUUID();
    assertThat('model is not painted dark gray', status(Date.now(), jobs({ run: async () => ({ code: 0 }) }), 'claude', model, tokens(), quota()).text(), containsString(` model:\x1b[100m${model}\x1b[49m `));
  });
  it('paints the tokens on a dark gray background', () => {
    const t = tokens();
    t.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 813 } } }));
    assertThat('tokens are not painted gray', status(Date.now(), jobs({ run: async () => ({ code: 0 }) }), 'claude', 'sonnet', t, quota()).text(), containsString(' tokens:\x1b[100m813\x1b[49m '));
  });
  it('shows a dash when nothing is known about the quota', () => {
    assertThat('unknown quota is not a dash', stripVTControlCharacters(status(Date.now(), jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', tokens(), quota()).text()), endsWith(' quota:-'));
  });
  it('labels every window of the quota', () => {
    const q = quota();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.29 }, seven_day: { utilization: 0.66 } } } }));
    assertThat('windows are not labeled', stripVTControlCharacters(status(Date.now(), jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', tokens(), q).text()), endsWith(' quota:71%-5H,34%-W'));
  });
  it('shows the five-hour quota that is left', () => {
    const q = quota();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.27 } } } }));
    assertThat('quota is not shown', stripVTControlCharacters(status(Date.now(), jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', tokens(), q).text()), endsWith(' quota:73%-5H'));
  });
  it('paints the quota on a dark gray background', () => {
    const q = quota();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.61 } } } }));
    assertThat('quota is not painted dark gray', status(Date.now(), jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', tokens(), q).text(), endsWith(' quota:\x1b[100m39%-5H\x1b[49m'));
  });
});
