// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { stripVTControlCharacters } from 'node:util';
import { assertThat, equalTo, containsString, everyItem, lessThanOrEqualTo } from 'hamjest';
import { Tty } from '../src/tty.js';

describe('Tty', () => {
  it('draws one line per wand', () => {
    const chunks = [];
    new Tty({ columns: 80, write: (c) => chunks.push(c) }, 3).row(1).show('a.md\tworking');
    assertThat('wrong number of lines', chunks.join('').split('\n').length - 1, equalTo(3));
  });
  it('shows the text of a row', () => {
    const chunks = [];
    const text = randomUUID();
    new Tty({ columns: 80, write: (c) => chunks.push(c) }, 2).row(0).show(`a.md\t${text}`);
    assertThat('row text was not drawn', chunks.join(''), containsString(text));
  });
  it('cuts lines to the terminal width', () => {
    const chunks = [];
    new Tty({ columns: 30, write: (c) => chunks.push(c) }, 2).row(0).show(`a.md\t${'x'.repeat(100)}`);
    assertThat(
      'line is wider than the terminal',
      stripVTControlCharacters(chunks.join('')).replace(/\r/g, '').split('\n').map((l) => l.length),
      everyItem(lessThanOrEqualTo(30))
    );
  });
  it('draws full lines when the terminal width is unknown', () => {
    const chunks = [];
    const text = randomUUID();
    new Tty({ columns: 0, write: (c) => chunks.push(c) }, 1).row(0).show(`a.md\t${text}`);
    assertThat('line was cut to nothing', chunks.join(''), containsString(text));
  });
  it('redraws lines in place', () => {
    const chunks = [];
    const tty = new Tty({ columns: 80, write: (c) => chunks.push(c) }, 4);
    tty.row(0).show('a.md\tfirst');
    tty.row(0).show('a.md\tsecond');
    assertThat('cursor did not move up', chunks.join(''), containsString('\x1b[4A'));
  });
  it('shows an elapsed timer', () => {
    const chunks = [];
    new Tty({ columns: 80, write: (c) => chunks.push(c) }, 1).row(0).show('a.md\tworking');
    assertThat('timer was not shown', chunks.join(''), containsString('00:00'));
  });
});
