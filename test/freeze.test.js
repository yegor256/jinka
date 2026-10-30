// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { assertThat, equalTo, promiseThat, rejected, fulfilled } from 'hamjest';
import { Freeze } from '../src/freeze.js';

describe('Freeze', () => {
  it('is not active from the start', () => {
    assertThat('fresh freeze is active', new Freeze(3, () => {}).active(), equalTo(false));
  });
  it('becomes active when turned on', () => {
    const freeze = new Freeze(4, () => {});
    freeze.on();
    assertThat('freeze did not turn on', freeze.active(), equalTo(true));
  });
  it('stops being active when turned off', () => {
    const freeze = new Freeze(5, () => {});
    freeze.on();
    freeze.off();
    assertThat('freeze did not turn off', freeze.active(), equalTo(false));
  });
  it('holds back a wand while active', async () => {
    const freeze = new Freeze(2, () => {});
    freeze.on();
    await promiseThat('wand was not held back', freeze.thaw(AbortSignal.timeout(50)), rejected());
  });
  it('lets a wand go when turned off', async () => {
    const freeze = new Freeze(2, () => {});
    freeze.on();
    setTimeout(() => freeze.off(), 20);
    await promiseThat('wand was not let go', freeze.thaw(AbortSignal.timeout(1000)), fulfilled());
  });
  it('quits when turned on while every wand is idle', () => {
    const quits = [];
    const freeze = new Freeze(2, () => quits.push(true));
    freeze.enter();
    freeze.enter();
    freeze.on();
    assertThat('freeze did not quit', quits, equalTo([true]));
  });
  it('quits when the last busy wand becomes idle', () => {
    const quits = [];
    const freeze = new Freeze(2, () => quits.push(true));
    freeze.enter();
    freeze.on();
    freeze.enter();
    assertThat('freeze did not quit', quits, equalTo([true]));
  });
  it('dont quit while a wand is busy', () => {
    const quits = [];
    const freeze = new Freeze(3, () => quits.push(true));
    freeze.enter();
    freeze.enter();
    freeze.enter();
    freeze.leave();
    freeze.on();
    assertThat('freeze quit with a busy wand', quits, equalTo([]));
  });
  it('dont quit when every wand is idle without a freeze', () => {
    const quits = [];
    const freeze = new Freeze(1, () => quits.push(true));
    freeze.enter();
    assertThat('freeze quit while not active', quits, equalTo([]));
  });
});
