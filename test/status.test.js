// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { stripVTControlCharacters } from 'node:util';
import { assertThat, startsWith, endsWith, containsString } from 'hamjest';
import { Status } from '../src/status.js';
import { Tokens } from '../src/tokens.js';
import { Quota } from '../src/quota.js';
import { Jobs } from '../src/jobs.js';

describe('Status', () => {
  it('shows the version and the uptime', () => {
    const version = randomUUID();
    assertThat('status line is wrong', stripVTControlCharacters(new Status(version, Date.now() - 3_725_000, new Jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', new Tokens(), new Quota()).text()), startsWith(`jinka ${version}, up 01:02:05`));
  });
  it('shows the count of done jobs right after the uptime', async () => {
    const jobs = new Jobs({ run: async () => ({ code: 0 }) });
    await jobs.run({}, { show: () => {} }, AbortSignal.timeout(1000));
    await jobs.run({}, { show: () => {} }, AbortSignal.timeout(1000));
    assertThat('done jobs are not shown', stripVTControlCharacters(new Status('0.1.1', Date.now() - 61_000, jobs, 'claude', 'opus', new Tokens(), new Quota()).text()), containsString(', up 00:01:01, done 2, agent claude,'));
  });
  it('paints the count of done jobs on a dark gray background', () => {
    assertThat('done jobs are not painted dark gray', new Status('0.1.2', Date.now(), new Jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', new Tokens(), new Quota()).text(), containsString(', done \x1b[100m0\x1b[49m,'));
  });
  it('shows the agent', () => {
    const agent = randomUUID();
    assertThat('agent is not shown', stripVTControlCharacters(new Status('0.0.7', Date.now(), new Jobs({ run: async () => ({ code: 0 }) }), agent, 'opus', new Tokens(), new Quota()).text()), containsString(`, agent ${agent}, model opus,`));
  });
  it('paints the agent on a dark gray background', () => {
    const agent = randomUUID();
    assertThat('agent is not painted dark gray', new Status('0.0.8', Date.now(), new Jobs({ run: async () => ({ code: 0 }) }), agent, 'opus', new Tokens(), new Quota()).text(), containsString(`, agent \x1b[100m${agent}\x1b[49m,`));
  });
  it('shows the model of the agents', () => {
    const model = randomUUID();
    assertThat('model is not shown', stripVTControlCharacters(new Status('0.0.1', Date.now(), new Jobs({ run: async () => ({ code: 0 }) }), 'claude', model, new Tokens(), new Quota()).text()), containsString(`, model ${model},`));
  });
  it('shows the default model when none is chosen', () => {
    assertThat('default model is not shown', stripVTControlCharacters(new Status('0.0.2', Date.now(), new Jobs({ run: async () => ({ code: 0 }) }), 'claude', '', new Tokens(), new Quota()).text()), containsString(', model default,'));
  });
  it('shows the tokens used by the agents', () => {
    const tokens = new Tokens();
    tokens.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 4_721 } } }));
    assertThat('tokens are not shown', stripVTControlCharacters(new Status('0.0.3', Date.now(), new Jobs({ run: async () => ({ code: 0 }) }), 'claude', 'haiku', tokens, new Quota()).text()), containsString(', tokens 4.7K,'));
  });
  it('paints the version on a dark gray background', () => {
    const version = randomUUID();
    assertThat('version is not painted dark gray', new Status(version, Date.now(), new Jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', new Tokens(), new Quota()).text(), startsWith(`jinka \x1b[100m${version}\x1b[49m,`));
  });
  it('paints the uptime on a dark gray background', () => {
    assertThat('uptime is not painted dark gray', new Status('0.0.4', Date.now() - 7_384_000, new Jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', new Tokens(), new Quota()).text(), containsString(', up \x1b[100m02:03:04\x1b[49m,'));
  });
  it('paints the model on a dark gray background', () => {
    const model = randomUUID();
    assertThat('model is not painted dark gray', new Status('0.0.5', Date.now(), new Jobs({ run: async () => ({ code: 0 }) }), 'claude', model, new Tokens(), new Quota()).text(), containsString(`, model \x1b[100m${model}\x1b[49m,`));
  });
  it('paints the tokens on a dark gray background', () => {
    const tokens = new Tokens();
    tokens.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 813 } } }));
    assertThat('tokens are not painted gray', new Status('0.0.6', Date.now(), new Jobs({ run: async () => ({ code: 0 }) }), 'claude', 'sonnet', tokens, new Quota()).text(), containsString(', tokens \x1b[100m813\x1b[49m,'));
  });
  it('shows the five-hour quota that is left', () => {
    const quota = new Quota();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.27 } } } }));
    assertThat('quota is not shown', stripVTControlCharacters(new Status('0.0.9', Date.now(), new Jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', new Tokens(), quota).text()), endsWith(', 5h-quota 73%'));
  });
  it('paints the quota on a dark gray background', () => {
    const quota = new Quota();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.61 } } } }));
    assertThat('quota is not painted dark gray', new Status('0.1.0', Date.now(), new Jobs({ run: async () => ({ code: 0 }) }), 'claude', 'opus', new Tokens(), quota).text(), endsWith(', 5h-quota \x1b[100m39%\x1b[49m'));
  });
});
