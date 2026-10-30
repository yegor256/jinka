// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { stripVTControlCharacters } from 'node:util';
import { assertThat, equalTo, containsString, not, everyItem, lessThanOrEqualTo, hasItem, startsWith, endsWith } from 'hamjest';
import { Tty } from '../src/tty.js';
import { Status } from '../src/status.js';
import { Legend } from '../src/legend.js';
import { Freeze } from '../src/freeze.js';

describe('Tty', () => {
  it('draws the status line, an empty line, one line per wand, and the separator', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 3, new Status('1.2.3', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {}))).row(1).show('a.md\tworking');
    assertThat('separator is not under the wands', stripVTControlCharacters(chunks.join('')).split('\n')[5], equalTo('-'.repeat(10)));
  });
  it('shows the version in the status line', () => {
    const chunks = [];
    const version = randomUUID();
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 1, new Status(version, Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {}))).row(0).show('a.md\tworking');
    assertThat('version was not shown', stripVTControlCharacters(chunks.join('')).split('\n')[0], containsString(version));
  });
  it('leaves an empty line under the status line', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 1, new Status('0.1.3', Date.now(), 'haiku'), new Legend(new Freeze(1, () => {}))).row(0).show('a.md\tworking');
    assertThat('line under the status line is not empty', stripVTControlCharacters(chunks.join('')).split('\n')[1], equalTo(''));
  });
  it('shows the text of a row', () => {
    const chunks = [];
    const text = randomUUID();
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 2, new Status('0.0.1', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {}))).row(0).show(`a.md\t${text}`);
    assertThat('row text was not drawn', chunks.join(''), containsString(text));
  });
  it('shows a protocol line below the separator', () => {
    const chunks = [];
    const text = randomUUID();
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 2, new Status('0.0.2', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {}))).protocol(1).show(`b.md\t${text}`);
    assertThat('protocol line was not drawn', stripVTControlCharacters(chunks.join('')).split('\n')[5], endsWith(`[2] b.md  ${text}`));
  });
  it('shows only the newest protocol lines that fit', () => {
    const chunks = [];
    const tty = new Tty({ columns: 80, rows: 6, write: (c) => chunks.push(c), on: () => {} }, 2, new Status('0.0.3', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {})));
    ['x.md\tfirst', 'y.md\tsecond', 'z.md\tthird'].forEach((t) => tty.protocol(0).show(t));
    assertThat('old protocol line was not dropped', chunks.at(-1), not(containsString('first')));
  });
  it('cuts lines to the terminal width', () => {
    const chunks = [];
    new Tty({ columns: 30, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 2, new Status('0.0.4', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {}))).row(0).show(`a.md\t${'x'.repeat(100)}`);
    assertThat(
      'line is wider than the terminal',
      stripVTControlCharacters(chunks.join('')).split('\n').map((l) => l.length),
      everyItem(lessThanOrEqualTo(30))
    );
  });
  it('draws full lines when the terminal width is unknown', () => {
    const chunks = [];
    const text = randomUUID();
    new Tty({ columns: 0, rows: 0, write: (c) => chunks.push(c), on: () => {} }, 1, new Status('0.0.5', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {}))).row(0).show(`a.md\t${text}`);
    assertThat('line was cut to nothing', chunks.join(''), containsString(text));
  });
  it('switches to the alternate buffer and hides the cursor', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 1, new Status('0.0.6', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {}))).row(0).show('a.md\tworking');
    assertThat('alternate buffer was not entered', chunks[0], equalTo('\x1b[?1049h\x1b[?25l'));
  });
  it('redraws the whole layout from the top left corner', () => {
    const chunks = [];
    const tty = new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 4, new Status('0.0.7', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {})));
    tty.row(0).show('a.md\tfirst');
    tty.row(0).show('a.md\tsecond');
    assertThat('cursor did not move home', chunks.at(-1), startsWith('\x1b[H'));
  });
  it('redraws the layout when the terminal is resized', () => {
    const chunks = [];
    const stream = Object.assign(new EventEmitter(), { columns: 80, rows: 24, write: (c) => chunks.push(c) });
    new Tty(stream, 1, new Status('0.0.8', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {}))).row(0).show('a.md\tworking');
    stream.columns = 12;
    stream.emit('resize');
    assertThat('layout was not redrawn to the new width', stripVTControlCharacters(chunks.at(-1)).split('\n')[2], equalTo('[1] a.md  00'));
  });
  it('shows an elapsed timer', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 1, new Status('0.0.9', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {}))).row(0).show('a.md\tworking');
    assertThat('timer was not shown', chunks.join(''), containsString('00:00'));
  });
  it('restores the normal buffer and the cursor on close', () => {
    const chunks = [];
    const tty = new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 1, new Status('0.1.0', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {})));
    tty.row(0).show('a.md\tworking');
    tty.close();
    assertThat('normal buffer was not restored', chunks, hasItem('\x1b[?25h\x1b[?1049l'));
  });
  it('writes nothing on close when it never drew', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 1, new Status('0.1.1', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {}))).close();
    assertThat('closed screen wrote something', chunks, equalTo([]));
  });
  it('restores the normal buffer only once', () => {
    const chunks = [];
    const tty = new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 1, new Status('0.1.2', Date.now(), 'sonnet'), new Legend(new Freeze(1, () => {})));
    tty.row(0).show('a.md\tworking');
    tty.close();
    tty.close();
    assertThat('normal buffer was restored twice', chunks.filter((c) => c === '\x1b[?25h\x1b[?1049l').length, equalTo(1));
  });
  it('pins the legend to the last row of the terminal', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 17, write: (c) => chunks.push(c), on: () => {} }, 2, new Status('0.1.3', Date.now(), 'opus'), new Legend(new Freeze(2, () => {})))
      .row(0)
      .show('a.md\tworking');
    assertThat('legend is not on the last row', stripVTControlCharacters(chunks.at(-1)).split('\n')[16], equalTo('F - to finish and quit'));
  });
  it('leaves an empty line above the legend', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 7, write: (c) => chunks.push(c), on: () => {} }, 1, new Status('0.1.4', Date.now(), 'opus'), new Legend(new Freeze(1, () => {})))
      .protocol(0)
      .show(`b.md\t${randomUUID()}`);
    assertThat('line above the legend is not empty', stripVTControlCharacters(chunks.at(-1)).split('\n')[5], equalTo(''));
  });
  it('shows the continue key while frozen', () => {
    const chunks = [];
    const freeze = new Freeze(3, () => {});
    freeze.on();
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, 1, new Status('0.1.5', Date.now(), 'opus'), new Legend(freeze)).row(0).show('a.md\tworking');
    assertThat('continue key is not shown', stripVTControlCharacters(chunks.at(-1)).split('\n').at(-1), equalTo('C - to continue'));
  });
});
