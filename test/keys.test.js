// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'node:events';
import { assertThat, equalTo } from 'hamjest';
import { Crew } from '../src/crew.js';
import { Row } from '../src/row.js';
import { Protocol } from '../src/protocol.js';
import { Keys } from '../src/keys.js';
import { Freeze } from '../src/freeze.js';

describe('Keys', () => {
  it('turns the terminal into raw mode', () => {
    const modes = [];
    new Keys(Object.assign(new EventEmitter(), { isTTY: true, setRawMode: (m) => modes.push(m) }), new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {}), new Crew(2, 16, new Protocol([])), () => {}).listen();
    assertThat('raw mode was not turned on', modes, equalTo([true]));
  });
  it('leaves a stream that is not a terminal as is', () => {
    const modes = [];
    new Keys(Object.assign(new EventEmitter(), { setRawMode: (m) => modes.push(m) }), new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {}), new Crew(2, 16, new Protocol([])), () => {}).listen();
    assertThat('raw mode was turned on for a pipe', modes, equalTo([]));
  });
  it('turns the freeze on by the lowercase key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const freeze = new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {});
    new Keys(stream, freeze, new Crew(2, 16, new Protocol([])), () => {}).listen();
    stream.emit('data', Buffer.from('f'));
    assertThat('freeze was not turned on', freeze.active(), equalTo(true));
  });
  it('turns the freeze on by the uppercase key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const freeze = new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {});
    new Keys(stream, freeze, new Crew(2, 16, new Protocol([])), () => {}).listen();
    stream.emit('data', Buffer.from('F'));
    assertThat('freeze was not turned on', freeze.active(), equalTo(true));
  });
  it('turns the freeze off by the continue key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const freeze = new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {});
    new Keys(stream, freeze, new Crew(2, 16, new Protocol([])), () => {}).listen();
    stream.emit('data', Buffer.from('fC'));
    assertThat('freeze was not turned off', freeze.active(), equalTo(false));
  });
  it('interrupts on control and C', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const interrupts = [];
    new Keys(stream, new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {}), new Crew(2, 16, new Protocol([])), () => interrupts.push(true)).listen();
    stream.emit('data', Buffer.from('\x03'));
    assertThat('interrupt was not called', interrupts, equalTo([true]));
  });
  it('ignores other keys', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const freeze = new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {});
    new Keys(stream, freeze, new Crew(2, 16, new Protocol([])), () => {}).listen();
    stream.emit('data', Buffer.from('xyz q'));
    assertThat('freeze was turned on by a wrong key', freeze.active(), equalTo(false));
  });
  it('adds a thread by the plus key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const crew = new Crew(3, 16, new Protocol([]));
    new Keys(stream, new Freeze(crew, new Protocol([]), new Row([], 0), () => {}), crew, () => {}).listen();
    stream.emit('data', Buffer.from('+'));
    assertThat('thread was not added', crew.size(), equalTo(4));
  });
  it('asks to remove a thread by the minus key', () => {
    const stream = Object.assign(new EventEmitter(), { setRawMode: () => {} });
    const notes = [];
    const crew = new Crew(3, 16, new Protocol(notes));
    new Keys(stream, new Freeze(crew, new Protocol([]), new Row([], 0), () => {}), crew, () => {}).listen();
    stream.emit('data', Buffer.from('-'));
    assertThat('thread removal was not asked', notes, equalTo([['warn', 'no idle thread can be removed right now']]));
  });
});
