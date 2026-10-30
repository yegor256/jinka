// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { EventEmitter } from 'node:events';
import { assertThat, equalTo } from 'hamjest';
import { Wheel } from '../src/wheel.js';

describe('Wheel', () => {
  it('scrolls up by the up arrow', () => {
    const stream = new EventEmitter();
    const moves = [];
    new Wheel(stream, { up: () => moves.push('up'), down: () => moves.push('down') }).listen();
    stream.emit('data', Buffer.from('\x1b[A'));
    assertThat('screen was not scrolled up', moves, equalTo(['up']));
  });
  it('scrolls down by the down arrow', () => {
    const stream = new EventEmitter();
    const moves = [];
    new Wheel(stream, { up: () => moves.push('up'), down: () => moves.push('down') }).listen();
    stream.emit('data', Buffer.from('\x1b[B'));
    assertThat('screen was not scrolled down', moves, equalTo(['down']));
  });
  it('understands arrows in the application cursor mode', () => {
    const stream = new EventEmitter();
    const moves = [];
    new Wheel(stream, { up: () => moves.push('up'), down: () => moves.push('down') }).listen();
    stream.emit('data', Buffer.from('\x1bOA\x1bOB\x1bOA'));
    assertThat('application arrows were not understood', moves, equalTo(['up', 'down', 'up']));
  });
  it('ignores other keys', () => {
    const stream = new EventEmitter();
    const moves = [];
    new Wheel(stream, { up: () => moves.push('up'), down: () => moves.push('down') }).listen();
    stream.emit('data', Buffer.from('AB[f+\x1b[C'));
    assertThat('screen was scrolled by a wrong key', moves, equalTo([]));
  });
});
