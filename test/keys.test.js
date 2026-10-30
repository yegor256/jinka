// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'node:events';
import { assertThat, equalTo } from 'hamjest';
import { Keys } from '../src/keys.js';
import { Freeze } from '../src/freeze.js';

describe('Keys', () => {
  it('turns the terminal into raw mode', () => {
    const modes = [];
    new Keys(Object.assign(new EventEmitter(), { setRawMode: (m) => modes.push(m) }), new Freeze(2, () => {}), () => {}).listen();
    assertThat('raw mode was not turned on', modes, equalTo([true]));
  });
  it('turns the freeze on by the lowercase key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const freeze = new Freeze(2, () => {});
    new Keys(stream, freeze, () => {}).listen();
    stream.emit('data', Buffer.from('f'));
    assertThat('freeze was not turned on', freeze.active(), equalTo(true));
  });
  it('turns the freeze on by the uppercase key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const freeze = new Freeze(2, () => {});
    new Keys(stream, freeze, () => {}).listen();
    stream.emit('data', Buffer.from('F'));
    assertThat('freeze was not turned on', freeze.active(), equalTo(true));
  });
  it('turns the freeze off by the continue key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const freeze = new Freeze(2, () => {});
    new Keys(stream, freeze, () => {}).listen();
    stream.emit('data', Buffer.from('fC'));
    assertThat('freeze was not turned off', freeze.active(), equalTo(false));
  });
  it('interrupts on control and C', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const interrupts = [];
    new Keys(stream, new Freeze(2, () => {}), () => interrupts.push(true)).listen();
    stream.emit('data', Buffer.from('\x03'));
    assertThat('interrupt was not called', interrupts, equalTo([true]));
  });
  it('ignores other keys', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const freeze = new Freeze(2, () => {});
    new Keys(stream, freeze, () => {}).listen();
    stream.emit('data', Buffer.from('xyz q'));
    assertThat('freeze was turned on by a wrong key', freeze.active(), equalTo(false));
  });
});
