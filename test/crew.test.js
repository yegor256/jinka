// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { setTimeout } from 'node:timers/promises';
import { assertThat, equalTo, hasItem } from 'hamjest';
import { crew } from '../src/crew.js';
import { protocol } from '../src/protocol.js';

describe('crew', () => {
  it('starts as many wands as it holds', async () => {
    const started = [];
    await crew(3, 16, protocol([])).run({ next: async () => ({}) }, async (i) => started.push(i), AbortSignal.timeout(1000));
    assertThat('wands were not started', started, equalTo([0, 1, 2]));
  });
  it('grows by one', () => {
    const c = crew(2, 16, protocol([]));
    c.more();
    assertThat('crew did not grow', c.size(), equalTo(3));
  });
  it('takes the first free index for a new wand', () => {
    const c = crew(4, 16, protocol([]));
    c.more();
    assertThat('new wand got a wrong index', c.indexes(), equalTo([0, 1, 2, 3, 4]));
  });
  it('starts one more wand while running', async () => {
    const c = crew(1, 16, protocol([]));
    const started = [];
    const signal = AbortSignal.timeout(100);
    const run = c.run({ next: async () => ({}) }, async (i, wishes, s) => { started.push(i); await setTimeout(1000, undefined, { signal: s }).catch(() => {}); }, signal);
    c.more();
    await run;
    assertThat('one more wand was not started', started, equalTo([0, 1]));
  });
  it('dont grow above the limit', () => {
    const c = crew(5, 5, protocol([]));
    c.more();
    assertThat('crew grew above the limit', c.size(), equalTo(5));
  });
  it('tells that it cannot grow above the limit', () => {
    const notes = [];
    crew(7, 7, protocol(notes)).more();
    assertThat('limit was not reported', notes, equalTo([['warn', 'more than 7 threads are not allowed']]));
  });
  it('retires an idle wand', async () => {
    const c = crew(2, 16, protocol([]));
    const retired = [];
    const run = c.run(
      { next: (s) => setTimeout(1000, {}, { signal: s }) },
      async (i, wishes, s) => wishes.next(s).catch(() => retired.push(i)),
      AbortSignal.timeout(300)
    );
    await setTimeout(20);
    c.less();
    await setTimeout(20);
    assertThat('idle wand was not retired', retired, equalTo([1]));
    await run;
  });
  it('shrinks by one when an idle wand retires', async () => {
    const c = crew(3, 16, protocol([]));
    const run = c.run({ next: (s) => setTimeout(1000, {}, { signal: s }) }, async (i, wishes, s) => wishes.next(s).catch(() => {}), AbortSignal.timeout(100));
    await setTimeout(20);
    c.less();
    assertThat('crew did not shrink', c.indexes(), equalTo([0, 1]));
    await run;
  });
  it('tells that no idle wand can retire while every wand is busy', () => {
    const notes = [];
    crew(3, 16, protocol(notes)).less();
    assertThat('busy wands were not reported', notes, equalTo([['warn', 'no idle thread can be removed right now']]));
  });
  it('tells that the last wand cannot retire', async () => {
    const notes = [];
    const c = crew(1, 16, protocol(notes));
    const run = c.run({ next: (s) => setTimeout(1000, {}, { signal: s }) }, async (i, wishes, s) => wishes.next(s).catch(() => {}), AbortSignal.timeout(100));
    await setTimeout(20);
    c.less();
    await run;
    assertThat('last wand was retired', notes, hasItem(equalTo(['warn', 'the last thread cannot be removed'])));
  });
});
