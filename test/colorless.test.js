// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { styleText } from 'node:util';
import { assertThat, equalTo, containsString } from 'hamjest';
import { colorless } from '../src/colorless.js';

describe('colorless', () => {
  it('drops the colors from the written text', () => {
    const chunks = [];
    const text = randomUUID();
    colorless({ write: (c) => chunks.push(c) }).write(`\x1b[38;2;215;119;87m${text}\x1b[39m ${styleText('bgGray', text, { validateStream: false })}\x1b[0m`);
    assertThat('colors were not dropped', chunks.join(''), equalTo(`${text} ${text}`));
  });
  it('keeps the cursor control in the written text', () => {
    const chunks = [];
    colorless({ write: (c) => chunks.push(c) }).write('\x1b[H\x1b[2Kfoo\x1b[J\x1b[?1049h');
    assertThat('cursor control was dropped', chunks.join(''), equalTo('\x1b[H\x1b[2Kfoo\x1b[J\x1b[?1049h'));
  });
  it('keeps the links in the written text', () => {
    const chunks = [];
    const url = `https://github.com/a/b/issues/${randomUUID()}`;
    colorless({ write: (c) => chunks.push(c) }).write(`\x1b]8;;${url}\x07\x1b[38;2;106;113;247ma/b\x1b[39m\x1b]8;;\x07`);
    assertThat('link was dropped', chunks.join(''), containsString(`\x1b]8;;${url}\x07a/b\x1b]8;;\x07`));
  });
  it('passes the callback to the stream', () => {
    const done = [];
    colorless({ write: (c, f) => f() }).write('\x1b[31mx\x1b[39m', () => done.push(true));
    assertThat('callback was not passed', done.length, equalTo(1));
  });
  it('reports the width of the stream', () => {
    const stream = { columns: 77, rows: 13 };
    const screen = colorless(stream);
    stream.columns = 131;
    assertThat('width of the stream is stale', screen.columns, equalTo(131));
  });
  it('reports the height of the stream', () => {
    assertThat('height of the stream is lost', colorless({ columns: 61, rows: 43 }).rows, equalTo(43));
  });
  it('listens to the events of the stream', () => {
    const events = [];
    colorless({ on: (e) => events.push(e) }).on('resize', () => {});
    assertThat('event was not passed to the stream', events, equalTo(['resize']));
  });
});
