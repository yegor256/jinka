// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { assertThat, equalTo, promiseThat, rejected, fulfilled } from 'hamjest';
import { crew } from '../src/crew.js';
import { protocol } from '../src/protocol.js';
import { freeze } from '../src/freeze.js';

describe('freeze', () => {
  it('is not active from the start', () => {
    assertThat('fresh freeze is active', freeze(crew(3, 16, protocol([])), protocol([]), () => {}).active(), equalTo(false));
  });
  it('becomes active when turned on', () => {
    const f = freeze(crew(4, 16, protocol([])), protocol([]), () => {});
    f.on();
    assertThat('freeze did not turn on', f.active(), equalTo(true));
  });
  it('stops being active when turned off', () => {
    const f = freeze(crew(5, 16, protocol([])), protocol([]), () => {});
    f.on();
    f.off();
    assertThat('freeze did not turn off', f.active(), equalTo(false));
  });
  it('holds back a wand while active', async () => {
    const f = freeze(crew(2, 16, protocol([])), protocol([]), () => {});
    f.on();
    await promiseThat('wand was not held back', f.thaw(AbortSignal.timeout(50)), rejected());
  });
  it('lets a wand go when turned off', async () => {
    const f = freeze(crew(2, 16, protocol([])), protocol([]), () => {});
    f.on();
    setTimeout(() => f.off(), 20);
    await promiseThat('wand was not let go', f.thaw(AbortSignal.timeout(1000)), fulfilled());
  });
  it('quits when turned on while every wand is idle', () => {
    const quits = [];
    const f = freeze(crew(2, 16, protocol([])), protocol([]), () => quits.push(true));
    f.enter();
    f.enter();
    f.on();
    assertThat('freeze did not quit', quits, equalTo([true]));
  });
  it('quits when the last busy wand becomes idle', () => {
    const quits = [];
    const f = freeze(crew(2, 16, protocol([])), protocol([]), () => quits.push(true));
    f.enter();
    f.on();
    f.enter();
    assertThat('freeze did not quit', quits, equalTo([true]));
  });
  it('dont quit while a wand is busy', () => {
    const quits = [];
    const f = freeze(crew(3, 16, protocol([])), protocol([]), () => quits.push(true));
    f.enter();
    f.enter();
    f.enter();
    f.leave();
    f.on();
    assertThat('freeze quit with a busy wand', quits, equalTo([]));
  });
  it('dont quit when every wand is idle without a freeze', () => {
    const quits = [];
    const f = freeze(crew(1, 16, protocol([])), protocol([]), () => quits.push(true));
    f.enter();
    assertThat('freeze quit while not active', quits, equalTo([]));
  });
  it('tells that it waits for all jobs to finish when turned on', () => {
    const notes = [];
    freeze(crew(3, 16, protocol([])), protocol(notes), () => {}).on();
    assertThat('finishing was not told', notes, equalTo([['warn', 'finishing, now we wait for all jobs to finish and then quit']]));
  });
  it('tells that it continues when turned off', () => {
    const notes = [];
    freeze(crew(2, 16, protocol([])), protocol(notes), () => {}).off();
    assertThat('continuing was not told', notes, equalTo([['warn', 'continuing, new jobs will start again']]));
  });
});
