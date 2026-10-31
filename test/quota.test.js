// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, closeTo, equalTo } from 'hamjest';
import { Quota } from '../src/quota.js';

describe('Quota', () => {
  it('knows nothing from the start', () => {
    assertThat('fresh quota is not a dash', new Quota().text(), equalTo('-'));
  });
  it('shows the share of the five-hour window that is left', () => {
    const quota = new Quota();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.44 }, seven_day: { utilization: 0.17 } } }, uuid: randomUUID() }));
    assertThat('remaining quota is wrong', quota.text(), equalTo('56%'));
  });
  it('rounds the share that is left', () => {
    const quota = new Quota();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.12873 } } } }));
    assertThat('remaining quota was not rounded', quota.text(), equalTo('87%'));
  });
  it('keeps the latest event', () => {
    const quota = new Quota();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.31 } } } }));
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.93 } } } }));
    assertThat('latest event was not kept', quota.text(), equalTo('7%'));
  });
  it('dont count lines without the five-hour window', () => {
    const quota = new Quota();
    quota.add(`not a json ${randomUUID()}`);
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { seven_day: { utilization: 0.6 } } } }));
    quota.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 42 } } }));
    assertThat('lines without the window were counted', quota.text(), equalTo('-'));
  });
  it('leaves the whole quota when nothing is known', () => {
    assertThat('fresh quota is not whole', new Quota().left(Date.now()), equalTo(100));
  });
  it('leaves the smallest share among all windows', () => {
    const quota = new Quota();
    const now = Date.now();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.23, resetsAt: now / 1000 + 600 }, seven_day: { utilization: 0.88, resetsAt: now / 1000 + 9000 } } } }));
    assertThat('smallest share was not left', quota.left(now), closeTo(12, 0.001));
  });
  it('restores the share of a window that was reset', () => {
    const quota = new Quota();
    const now = Date.now();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.97, resetsAt: now / 1000 - 30 }, seven_day: { utilization: 0.41, resetsAt: now / 1000 + 7000 } } } }));
    assertThat('reset window was not restored', quota.left(now), closeTo(59, 0.001));
  });
});
