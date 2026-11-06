// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'node:events';
import { assertThat, equalTo } from 'hamjest';
import { crew } from '../src/crew.js';
import { row } from '../src/row.js';
import { protocol } from '../src/protocol.js';
import { keys } from '../src/keys.js';
import { freeze } from '../src/freeze.js';

describe('keys', () => {
  it('turns the terminal into raw mode', () => {
    const modes = [];
    keys(Object.assign(new EventEmitter(), { isTTY: true, setRawMode: (m) => modes.push(m) }), freeze(crew(2, 16, protocol([])), protocol([]), () => {}), crew(2, 16, protocol([])), () => {}).listen();
    assertThat('raw mode was not turned on', modes, equalTo([true]));
  });
  it('leaves a stream that is not a terminal as is', () => {
    const modes = [];
    keys(Object.assign(new EventEmitter(), { setRawMode: (m) => modes.push(m) }), freeze(crew(2, 16, protocol([])), protocol([]), () => {}), crew(2, 16, protocol([])), () => {}).listen();
    assertThat('raw mode was turned on for a pipe', modes, equalTo([]));
  });
  it('turns the freeze on by the lowercase key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const f = freeze(crew(2, 16, protocol([])), protocol([]), () => {});
    keys(stream, f, crew(2, 16, protocol([])), () => {}).listen();
    stream.emit('data', Buffer.from('f'));
    assertThat('freeze was not turned on', f.active(), equalTo(true));
  });
  it('turns the freeze on by the uppercase key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const f = freeze(crew(2, 16, protocol([])), protocol([]), () => {});
    keys(stream, f, crew(2, 16, protocol([])), () => {}).listen();
    stream.emit('data', Buffer.from('F'));
    assertThat('freeze was not turned on', f.active(), equalTo(true));
  });
  it('turns the freeze off by the continue key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const f = freeze(crew(2, 16, protocol([])), protocol([]), () => {});
    keys(stream, f, crew(2, 16, protocol([])), () => {}).listen();
    stream.emit('data', Buffer.from('fC'));
    assertThat('freeze was not turned off', f.active(), equalTo(false));
  });
  it('interrupts on control and C', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const interrupts = [];
    keys(stream, freeze(crew(2, 16, protocol([])), protocol([]), () => {}), crew(2, 16, protocol([])), () => interrupts.push(true)).listen();
    stream.emit('data', Buffer.from('\x03'));
    assertThat('interrupt was not called', interrupts, equalTo([true]));
  });
  it('ignores other keys', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const f = freeze(crew(2, 16, protocol([])), protocol([]), () => {});
    keys(stream, f, crew(2, 16, protocol([])), () => {}).listen();
    stream.emit('data', Buffer.from('xyz q'));
    assertThat('freeze was turned on by a wrong key', f.active(), equalTo(false));
  });
  it('adds a thread by the plus key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const c = crew(3, 16, protocol([]));
    keys(stream, freeze(c, protocol([]), row([], 0), () => {}), c, () => {}).listen();
    stream.emit('data', Buffer.from('+'));
    assertThat('thread was not added', c.size(), equalTo(4));
  });
  it('asks to remove a thread by the minus key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const c = crew(3, 16, protocol([]));
    keys(stream, freeze(c, protocol([]), row([], 0), () => {}), c, () => {}).listen();
    stream.emit('data', Buffer.from('-'));
    assertThat('thread was not removed', c.size(), equalTo(2));
  });
});
