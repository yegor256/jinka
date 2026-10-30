// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { setTimeout } from 'node:timers/promises';
import { assertThat, equalTo, hasItem } from 'hamjest';
import { Crew } from '../src/crew.js';
import { Protocol } from '../src/protocol.js';

describe('Crew', () => {
  it('starts as many wands as it holds', async () => {
    const started = [];
    await new Crew(3, 16, new Protocol([])).run({ next: async () => ({}) }, async (i) => started.push(i), AbortSignal.timeout(1000));
    assertThat('wands were not started', started, equalTo([0, 1, 2]));
  });
  it('grows by one', () => {
    const crew = new Crew(2, 16, new Protocol([]));
    crew.more();
    assertThat('crew did not grow', crew.size(), equalTo(3));
  });
  it('takes the first free index for a new wand', () => {
    const crew = new Crew(4, 16, new Protocol([]));
    crew.more();
    assertThat('new wand got a wrong index', crew.indexes(), equalTo([0, 1, 2, 3, 4]));
  });
  it('starts one more wand while running', async () => {
    const crew = new Crew(1, 16, new Protocol([]));
    const started = [];
    const signal = AbortSignal.timeout(100);
    const run = crew.run({ next: async () => ({}) }, async (i, wishes, s) => { started.push(i); await setTimeout(1000, undefined, { signal: s }).catch(() => {}); }, signal);
    crew.more();
    await run;
    assertThat('one more wand was not started', started, equalTo([0, 1]));
  });
  it('dont grow above the limit', () => {
    const crew = new Crew(5, 5, new Protocol([]));
    crew.more();
    assertThat('crew grew above the limit', crew.size(), equalTo(5));
  });
  it('tells that it cannot grow above the limit', () => {
    const notes = [];
    new Crew(7, 7, new Protocol(notes)).more();
    assertThat('limit was not reported', notes, equalTo([['warn', 'more than 7 threads are not allowed']]));
  });
  it('retires an idle wand', async () => {
    const crew = new Crew(2, 16, new Protocol([]));
    const retired = [];
    const run = crew.run(
      { next: (s) => setTimeout(1000, {}, { signal: s }) },
      async (i, wishes, s) => wishes.next(s).catch(() => retired.push(i)),
      AbortSignal.timeout(300)
    );
    await setTimeout(20);
    crew.less();
    await setTimeout(20);
    assertThat('idle wand was not retired', retired, equalTo([1]));
    await run;
  });
  it('shrinks by one when an idle wand retires', async () => {
    const crew = new Crew(3, 16, new Protocol([]));
    const run = crew.run({ next: (s) => setTimeout(1000, {}, { signal: s }) }, async (i, wishes, s) => wishes.next(s).catch(() => {}), AbortSignal.timeout(100));
    await setTimeout(20);
    crew.less();
    assertThat('crew did not shrink', crew.indexes(), equalTo([0, 1]));
    await run;
  });
  it('tells that no idle wand can retire while every wand is busy', () => {
    const notes = [];
    new Crew(3, 16, new Protocol(notes)).less();
    assertThat('busy wands were not reported', notes, equalTo([['warn', 'no idle thread can be removed right now']]));
  });
  it('tells that the last wand cannot retire', async () => {
    const notes = [];
    const crew = new Crew(1, 16, new Protocol(notes));
    const run = crew.run({ next: (s) => setTimeout(1000, {}, { signal: s }) }, async (i, wishes, s) => wishes.next(s).catch(() => {}), AbortSignal.timeout(100));
    await setTimeout(20);
    crew.less();
    await run;
    assertThat('last wand was retired', notes, hasItem(equalTo(['warn', 'the last thread cannot be removed'])));
  });
});
