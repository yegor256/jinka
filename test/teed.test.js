// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo } from 'hamjest';
import { teed } from '../src/teed.js';
import { protocol } from '../src/protocol.js';

describe('teed', () => {
  it('sends a notice to the wrapped screen', () => {
    const lines = [];
    const text = randomUUID();
    teed({ notice: () => protocol(lines) }, { notice: () => protocol([]) }).notice().info(text);
    assertThat('notice did not reach the screen', lines, equalTo([['info', text]]));
  });
  it('sends a warning to the copy', () => {
    const lines = [];
    const text = randomUUID();
    teed({ notice: () => protocol([]) }, { notice: () => protocol(lines) }).notice().warn(text);
    assertThat('warning did not reach the copy', lines, equalTo([['warn', text]]));
  });
  it('gives the row of the wrapped screen', () => {
    const row = randomUUID();
    assertThat('row is not from the wrapped screen', teed({ row: (i) => `${row}${i}` }, {}).row(7), equalTo(`${row}7`));
  });
  it('scrolls the wrapped screen up and down', () => {
    const moves = [];
    const screen = teed({ up: () => moves.push('up'), down: () => moves.push('down') }, {});
    screen.up();
    screen.down();
    assertThat('wrapped screen did not scroll', moves, equalTo(['up', 'down']));
  });
  it('closes both the screen and the copy', () => {
    const closed = [];
    teed({ close: () => closed.push('screen') }, { close: () => closed.push('copy') }).close();
    assertThat('screen and copy were not closed', closed, equalTo(['screen', 'copy']));
  });
});
