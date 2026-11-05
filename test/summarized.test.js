// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo } from 'hamjest';
import { summarized } from '../src/summarized.js';

describe('summarized', () => {
  it('prints the summary right after the screen closes', () => {
    const chunks = [];
    const text = randomUUID();
    summarized({ close: () => chunks.push('protocol') }, { text: () => text }, { write: (c) => chunks.push(c) }).close();
    assertThat('summary is not printed after the protocol', chunks, equalTo(['protocol', text]));
  });
  it('prints the summary only once', () => {
    const chunks = [];
    const screen = summarized({ close: () => {} }, { text: () => 'summary' }, { write: (c) => chunks.push(c) });
    screen.close();
    screen.close();
    assertThat('summary is printed twice', chunks.length, equalTo(1));
  });
  it('gives the row of the wrapped screen', () => {
    const row = randomUUID();
    assertThat('row is not from the wrapped screen', summarized({ row: (i) => `${row}${i}` }, { text: () => '' }, { write: () => {} }).row(3), equalTo(`${row}3`));
  });
  it('gives the notice of the wrapped screen', () => {
    const notice = randomUUID();
    assertThat('notice is not from the wrapped screen', summarized({ notice: () => notice }, { text: () => '' }, { write: () => {} }).notice(), equalTo(notice));
  });
  it('scrolls the wrapped screen up', () => {
    const moves = [];
    summarized({ up: () => moves.push('up') }, { text: () => '' }, { write: () => {} }).up();
    assertThat('wrapped screen did not scroll up', moves, equalTo(['up']));
  });
  it('scrolls the wrapped screen down', () => {
    const moves = [];
    summarized({ down: () => moves.push('down') }, { text: () => '' }, { write: () => {} }).down();
    assertThat('wrapped screen did not scroll down', moves, equalTo(['down']));
  });
});
