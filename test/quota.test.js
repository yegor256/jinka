// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, closeTo, equalTo } from 'hamjest';
import { quota } from '../src/quota.js';

describe('quota', () => {
  it('knows nothing from the start', () => {
    assertThat('fresh quota is not a dash', quota().text(Date.now()), equalTo('-'));
  });
  it('shows the share of every window that is left', () => {
    const q = quota();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.44 }, seven_day: { utilization: 0.17 } } }, uuid: randomUUID() }));
    assertThat('remaining quota is wrong', q.text(Date.now()), equalTo('56%-5H,83%-W'));
  });
  it('rounds the share that is left', () => {
    const q = quota();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.12873 } } } }));
    assertThat('remaining quota was not rounded', q.text(Date.now()), equalTo('87%-5H'));
  });
  it('keeps the latest event', () => {
    const q = quota();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.31 } } } }));
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.93 } } } }));
    assertThat('latest event was not kept', q.text(Date.now()), equalTo('7%-5H'));
  });
  it('shows the share of the only window there is', () => {
    const q = quota();
    q.add(`not a json ${randomUUID()}`);
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { thirty_day: { utilization: 0.08 } } } }));
    q.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 42 } } }));
    assertThat('the only window was not shown', q.text(Date.now()), equalTo('92%-M'));
  });
  it('labels the weekly window with overage included', () => {
    const q = quota();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { seven_day_overage_included: { utilization: 0.15 } } } }));
    assertThat('overage window has a long label', q.text(Date.now()), equalTo('85%-W+'));
  });
  it('keeps the name of a window without a label', () => {
    const q = quota();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { '90_minute': { utilization: 0.19 } } } }));
    assertThat('unlabeled window lost its name', q.text(Date.now()), equalTo('81%-90-minute'));
  });
  it('skips the share of a window that was reset', () => {
    const q = quota();
    const now = Date.now();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.94, resetsAt: now / 1000 - 20 }, seven_day: { utilization: 0.74, resetsAt: now / 1000 + 4000 } } } }));
    assertThat('reset window was shown', q.text(now), equalTo('26%-W'));
  });
  it('knows nothing when every window was reset', () => {
    const q = quota();
    const now = Date.now();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.83, resetsAt: now / 1000 - 70 } } } }));
    assertThat('reset quota is not a dash', q.text(now), equalTo('-'));
  });
  it('has no name when nothing is known', () => {
    assertThat('fresh quota has a name', quota().name(Date.now()), equalTo(''));
  });
  it('leaves the whole quota when nothing is known', () => {
    assertThat('fresh quota is not whole', quota().left(Date.now()), equalTo(100));
  });
  it('leaves the smallest share among all windows', () => {
    const q = quota();
    const now = Date.now();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.23, resetsAt: now / 1000 + 600 }, seven_day: { utilization: 0.88, resetsAt: now / 1000 + 9000 } } } }));
    assertThat('smallest share was not left', q.left(now), closeTo(12, 0.001));
  });
  it('restores the share of a window that was reset', () => {
    const q = quota();
    const now = Date.now();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.97, resetsAt: now / 1000 - 30 }, seven_day: { utilization: 0.41, resetsAt: now / 1000 + 7000 } } } }));
    assertThat('reset window was not restored', q.left(now), closeTo(59, 0.001));
  });
  it('names the window with the smallest share', () => {
    const q = quota();
    const now = Date.now();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.31, resetsAt: now / 1000 + 800 }, seven_day: { utilization: 0.93, resetsAt: now / 1000 + 9500 } } } }));
    assertThat('tightest window was not named', q.name(now), equalTo('seven-day'));
  });
  it('skips the name of a window that was reset', () => {
    const q = quota();
    const now = Date.now();
    q.add(JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.99, resetsAt: now / 1000 - 45 }, seven_day: { utilization: 0.37, resetsAt: now / 1000 + 6000 } } } }));
    assertThat('reset window was named', q.name(now), equalTo('seven-day'));
  });
});
