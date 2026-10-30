// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { stripVTControlCharacters } from 'node:util';
import { assertThat, equalTo, containsString, not, everyItem, lessThanOrEqualTo, hasItem, startsWith, endsWith, matchesPattern } from 'hamjest';
import { Crew } from '../src/crew.js';
import { Row } from '../src/row.js';
import { Tty } from '../src/tty.js';
import { Status } from '../src/status.js';
import { Tokens } from '../src/tokens.js';
import { Quota } from '../src/quota.js';
import { Legend } from '../src/legend.js';
import { Freeze } from '../src/freeze.js';

describe('Tty', () => {
  it('draws the status line, an empty line, one line per wand, and the separator', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(3, 16, new Row([], 0)), new Status('1.2.3', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).row(1).show('a.md\tworking');
    assertThat('separator is not under the wands', stripVTControlCharacters(chunks.join('')).split('\n')[5], equalTo('-'.repeat(10)));
  });
  it('shows the version in the status line', () => {
    const chunks = [];
    const version = randomUUID();
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status(version, Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).row(0).show('a.md\tworking');
    assertThat('version was not shown', stripVTControlCharacters(chunks.join('')).split('\n')[0], containsString(version));
  });
  it('leaves an empty line under the status line', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.1.3', Date.now(), 'claude', 'haiku', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).row(0).show('a.md\tworking');
    assertThat('line under the status line is not empty', stripVTControlCharacters(chunks.join('')).split('\n')[1], equalTo(''));
  });
  it('shows the text of a row', () => {
    const chunks = [];
    const text = randomUUID();
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(2, 16, new Row([], 0)), new Status('0.0.1', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).row(0).show(`a.md\t${text}`);
    assertThat('row text was not drawn', chunks.join(''), containsString(text));
  });
  it('shows only the newest protocol lines that fit', () => {
    const chunks = [];
    const tty = new Tty({ columns: 80, rows: 6, write: (c) => chunks.push(c), on: () => {} }, new Crew(2, 16, new Row([], 0)), new Status('0.0.3', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {})));
    ['first', 'second', 'third'].forEach((t) => tty.notice().show(t));
    assertThat('old protocol line was not dropped', chunks.at(-1), not(containsString('first')));
  });
  it('cuts lines to the terminal width', () => {
    const chunks = [];
    new Tty({ columns: 30, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(2, 16, new Row([], 0)), new Status('0.0.4', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).row(0).show(`a.md\t${'x'.repeat(100)}`);
    assertThat(
      'line is wider than the terminal',
      stripVTControlCharacters(chunks.join('')).split('\n').map((l) => l.length),
      everyItem(lessThanOrEqualTo(30))
    );
  });
  it('draws full lines when the terminal width is unknown', () => {
    const chunks = [];
    const text = randomUUID();
    new Tty({ columns: 0, rows: 0, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.0.5', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).row(0).show(`a.md\t${text}`);
    assertThat('line was cut to nothing', chunks.join(''), containsString(text));
  });
  it('switches to the alternate buffer and hides the cursor', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.0.6', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).row(0).show('a.md\tworking');
    assertThat('alternate buffer was not entered', chunks[0], equalTo('\x1b[?1049h\x1b[?25l'));
  });
  it('redraws the whole layout from the top left corner', () => {
    const chunks = [];
    const tty = new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(4, 16, new Row([], 0)), new Status('0.0.7', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {})));
    tty.row(0).show('a.md\tfirst');
    tty.row(0).show('a.md\tsecond');
    assertThat('cursor did not move home', chunks.at(-1), startsWith('\x1b[H'));
  });
  it('redraws the layout when the terminal is resized', () => {
    const chunks = [];
    const stream = Object.assign(new EventEmitter(), { columns: 80, rows: 24, write: (c) => chunks.push(c) });
    new Tty(stream, new Crew(1, 16, new Row([], 0)), new Status('0.0.8', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).row(0).show('a.md\tworking');
    stream.columns = 12;
    stream.emit('resize');
    assertThat('layout was not redrawn to the new width', stripVTControlCharacters(chunks.at(-1)).split('\n')[2], equalTo('[1] a.md  00'));
  });
  it('shows an elapsed timer', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.0.9', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).row(0).show('a.md\tworking');
    assertThat('timer was not shown', chunks.join(''), containsString('00:00'));
  });
  it('restores the normal buffer and the cursor on close', () => {
    const chunks = [];
    const tty = new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.1.0', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {})));
    tty.row(0).show('a.md\tworking');
    tty.close();
    assertThat('normal buffer was not restored', chunks, hasItem('\x1b[?25h\x1b[?1049l'));
  });
  it('prints the protocol lines that no longer fit the screen on close', () => {
    const chunks = [];
    const text = randomUUID();
    const tty = new Tty({ columns: 80, rows: 6, write: (c) => chunks.push(c), on: () => {} }, new Crew(2, 16, new Row([], 0)), new Status('0.1.6', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {})));
    [text, 'second', 'third'].forEach((t) => tty.notice().show(t));
    tty.close();
    assertThat('old protocol line was not printed on close', chunks.at(-1), containsString(`${text}\n`));
  });
  it('prints the protocol right after the normal buffer comes back', () => {
    const chunks = [];
    const text = randomUUID();
    const tty = new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.1.7', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {})));
    tty.notice().show(text);
    tty.close();
    assertThat('protocol was not printed after the normal buffer', chunks.slice(chunks.indexOf('\x1b[?25h\x1b[?1049l') + 1).join(''), containsString(text));
  });
  it('writes nothing on close when it never drew', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.1.1', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).close();
    assertThat('closed screen wrote something', chunks, equalTo([]));
  });
  it('restores the normal buffer only once', () => {
    const chunks = [];
    const tty = new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.1.2', Date.now(), 'claude', 'sonnet', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {})));
    tty.row(0).show('a.md\tworking');
    tty.close();
    tty.close();
    assertThat('normal buffer was restored twice', chunks.filter((c) => c === '\x1b[?25h\x1b[?1049l').length, equalTo(1));
  });
  it('pins the legend to the last row of the terminal', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 17, write: (c) => chunks.push(c), on: () => {} }, new Crew(2, 16, new Row([], 0)), new Status('0.1.3', Date.now(), 'claude', 'opus', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(2, 16, new Row([], 0)), () => {})))
      .row(0)
      .show('a.md\tworking');
    assertThat('legend is not on the last row', stripVTControlCharacters(chunks.at(-1)).split('\n')[16], equalTo('F - to finish and quit, +/- to add threads'));
  });
  it('leaves an empty line above the legend', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 7, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.1.4', Date.now(), 'claude', 'opus', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {})))
      .notice()
      .show(randomUUID());
    assertThat('line above the legend is not empty', stripVTControlCharacters(chunks.at(-1)).split('\n')[5], equalTo(''));
  });
  it('shows the continue key while frozen', () => {
    const chunks = [];
    const freeze = new Freeze(new Crew(3, 16, new Row([], 0)), () => {});
    freeze.on();
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.1.5', Date.now(), 'claude', 'opus', new Tokens(), new Quota()), new Legend(freeze)).row(0).show('a.md\tworking');
    assertThat('continue key is not shown', stripVTControlCharacters(chunks.at(-1)).split('\n').at(-1), equalTo('C - to continue'));
  });
  it('draws one more line when the crew grows', () => {
    const chunks = [];
    const crew = new Crew(2, 16, new Row([], 0));
    const tty = new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, crew, new Status('0.1.8', Date.now(), 'claude', 'opus', new Tokens(), new Quota()), new Legend(new Freeze(crew, () => {})));
    crew.more();
    tty.row(2).show('c.md\tworking');
    assertThat('new line was not drawn', stripVTControlCharacters(chunks.at(-1)).split('\n')[4], startsWith('[3] c.md'));
  });
  it('shows a notice below the separator', () => {
    const chunks = [];
    const text = randomUUID();
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.1.9', Date.now(), 'claude', 'opus', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).notice().show(text);
    assertThat('notice was not drawn', stripVTControlCharacters(chunks.at(-1)).split('\n')[4], matchesPattern(new RegExp(`^\\d{2}:\\d{2}:\\d{2} ${text}$`)));
  });
  it('cuts a line without counting the escape codes', () => {
    const chunks = [];
    new Tty({ columns: 5, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.2.0', Date.now(), 'claude', 'opus', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).row(0).show('a.md\tworking');
    assertThat('escape codes were counted as visible', chunks.at(-1).split('\n').at(-1), startsWith('\x1b[2K\x1b[100mF\x1b[49m - t'));
  });
  it('resets the style at the end of every line', () => {
    const chunks = [];
    new Tty({ columns: 80, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(2, 16, new Row([], 0)), new Status('0.2.1', Date.now(), 'claude', 'opus', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).row(1).show('b.md\tworking');
    assertThat('style was not reset after a line', chunks.at(-1).split('\n').slice(0, -1), everyItem(endsWith('\x1b[0m')));
  });
  it('wraps a long protocol line instead of cutting it', () => {
    const chunks = [];
    const text = `${randomUUID()}${randomUUID()}`;
    new Tty({ columns: 20, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.2.2', Date.now(), 'claude', 'opus', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).notice().show(text);
    assertThat('protocol line was cut', stripVTControlCharacters(chunks.at(-1)).split('\n').slice(4, 10).map((l, i) => (i === 0 ? l.slice(9) : l.slice(2))).join(''), equalTo(text));
  });
  it('indents the continuation of a wrapped protocol line by two spaces', () => {
    const chunks = [];
    new Tty({ columns: 15, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.2.3', Date.now(), 'claude', 'opus', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).notice().show('abcdefghijklmn');
    assertThat('continuation is not indented', stripVTControlCharacters(chunks.at(-1)).split('\n')[5], equalTo('  ghijklmn'));
  });
  it('keeps the time of a wrapped protocol line at the left edge', () => {
    const chunks = [];
    new Tty({ columns: 15, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.2.4', Date.now(), 'claude', 'opus', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).notice().show('abcdefghijklmn');
    assertThat('time is not at the left edge', stripVTControlCharacters(chunks.at(-1)).split('\n')[4], matchesPattern(/^\d{2}:\d{2}:\d{2} abcdef$/));
  });
  it('drops the oldest screen lines of a wrapped protocol when they do not fit', () => {
    const chunks = [];
    new Tty({ columns: 15, rows: 8, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.2.5', Date.now(), 'claude', 'opus', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).notice().show('abcdefghijklmnopqrstuvwxyz');
    assertThat('newest piece of the protocol is not shown', stripVTControlCharacters(chunks.at(-1)).split('\n')[5], equalTo('  tuvwxyz'));
  });
  it('turns a link to a pull request into a short clickable hyperlink', () => {
    const chunks = [];
    const url = `https://github.com/y-${Math.floor(Math.random() * 1000)}/r.x/pull/${Math.floor(Math.random() * 1000)}`;
    new Tty({ columns: 200, rows: 24, write: (c) => chunks.push(c), on: () => {} }, new Crew(1, 16, new Row([], 0)), new Status('0.2.1', Date.now(), 'claude', 'opus', new Tokens(), new Quota()), new Legend(new Freeze(new Crew(1, 16, new Row([], 0)), () => {}))).notice().show(`Merged ü ${url}`);
    assertThat('link was not clickable', chunks.at(-1), containsString(`\x1b]8;;${url}\x07${url.slice(19).replace('/pull/', '#')}\x1b]8;;\x07`));
  });
});
