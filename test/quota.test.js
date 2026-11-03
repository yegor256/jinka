// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, closeTo, equalTo } from 'hamjest';
import { Quota } from '../src/quota.js';

describe('Quota', () => {
  it('knows nothing from the start', () => {
    assertThat('fresh quota is not a dash', new Quota().text(Date.now()), equalTo('-'));
  });
  it('shows the share of the five-hour window that is left', () => {
    const quota = new Quota();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.44 }, seven_day: { utilization: 0.17 } } }, uuid: randomUUID() }));
    assertThat('remaining quota is wrong', quota.text(Date.now()), equalTo('56%'));
  });
  it('rounds the share that is left', () => {
    const quota = new Quota();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.12873 } } } }));
    assertThat('remaining quota was not rounded', quota.text(Date.now()), equalTo('87%'));
  });
  it('keeps the latest event', () => {
    const quota = new Quota();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.31 } } } }));
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.93 } } } }));
    assertThat('latest event was not kept', quota.text(Date.now()), equalTo('7%'));
  });
  it('shows the share of the only window there is', () => {
    const quota = new Quota();
    quota.add(`not a json ${randomUUID()}`);
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { thirty_day: { utilization: 0.08 } } } }));
    quota.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 42 } } }));
    assertThat('the only window was not shown', quota.text(Date.now()), equalTo('92%'));
  });
  it('shows the share of the tightest window', () => {
    const quota = new Quota();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.19 }, seven_day: { utilization: 0.74 } } } }));
    assertThat('tightest window was not shown', quota.text(Date.now()), equalTo('26%'));
  });
  it('knows nothing when every window was reset', () => {
    const quota = new Quota();
    const now = Date.now();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.83, resetsAt: now / 1000 - 70 } } } }));
    assertThat('reset quota is not a dash', quota.text(now), equalTo('-'));
  });
  it('has no name when nothing is known', () => {
    assertThat('fresh quota has a name', new Quota().name(Date.now()), equalTo(''));
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
  it('names the window with the smallest share', () => {
    const quota = new Quota();
    const now = Date.now();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.31, resetsAt: now / 1000 + 800 }, seven_day: { utilization: 0.93, resetsAt: now / 1000 + 9500 } } } }));
    assertThat('tightest window was not named', quota.name(now), equalTo('seven-day'));
  });
  it('skips the name of a window that was reset', () => {
    const quota = new Quota();
    const now = Date.now();
    quota.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.99, resetsAt: now / 1000 - 45 }, seven_day: { utilization: 0.37, resetsAt: now / 1000 + 6000 } } } }));
    assertThat('reset window was named', quota.name(now), equalTo('seven-day'));
  });
});
