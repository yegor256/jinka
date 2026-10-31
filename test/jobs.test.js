// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo } from 'hamjest';
import { Jobs } from '../src/jobs.js';

describe('Jobs', () => {
  it('counts nothing from the start', () => {
    assertThat('fresh counter is not zero', new Jobs({ run: async () => ({ code: 0 }) }).text(), equalTo('0'));
  });
  it('counts every successful run', async () => {
    const jobs = new Jobs({ run: async () => ({ code: 0 }) });
    await jobs.run({}, { show: () => {} }, AbortSignal.timeout(1000));
    await jobs.run({}, { show: () => {} }, AbortSignal.timeout(1000));
    await jobs.run({}, { show: () => {} }, AbortSignal.timeout(1000));
    assertThat('successful runs were not counted', jobs.text(), equalTo('3'));
  });
  it('does not count a failed run', async () => {
    const jobs = new Jobs({ run: async () => ({ code: 7 }) });
    await jobs.run({}, { show: () => {} }, AbortSignal.timeout(1000));
    assertThat('failed run was counted', jobs.text(), equalTo('0'));
  });
  it('returns what the agent returns', async () => {
    const summary = randomUUID();
    assertThat('result of the agent was changed', await new Jobs({ run: async () => ({ code: 0, summary }) }).run({}, { show: () => {} }, AbortSignal.timeout(1000)), equalTo({ code: 0, summary }));
  });
});
