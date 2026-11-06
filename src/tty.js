// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { stripVTControlCharacters, styleText } from 'node:util';
import sliceAnsi from 'slice-ansi';
import { row } from './row.js';
import { protocol } from './protocol.js';
import { duration } from './duration.js';
import { logo } from './logo.js';

export const tty = (stream, crew, status, legend) => {
  const lines = new Map();
  const notes = [];
  const clock = [];
  const view = { depth: 0 };
  const edge = (text, width) => {
    const [left, right] = text.split('\t');
    return `${left}${' '.repeat(Math.max(1, width - 1 - stripVTControlCharacters(left).length - stripVTControlCharacters(right).length))}${right}`;
  };
  const cut = (text, width) => {
    const plain = stripVTControlCharacters(text);
    const space = plain.lastIndexOf(' ', width);
    return space > 2 && plain.slice(space + 1).split(' ')[0].length <= width - 2 ? [space, space + 1] : [width, width];
  };
  const wrap = (text, width) => {
    if (stripVTControlCharacters(text).length <= width || width < 3) {
      return [text];
    }
    const [end, start] = cut(text, width);
    return [sliceAnsi(text, 0, end), ...wrap(`  ${sliceAnsi(text, start)}`, width)];
  };
  const draw = () => {
    const rows = stream.rows || 24;
    const wands = crew.indexes().map((i) => [i, lines.get(i) ?? { head: '', tail: '', start: Date.now() }]);
    const width = Math.max(...wands.map(([, l]) => stripVTControlCharacters(l.head).length));
    const columns = stream.columns || 80;
    const wrapped = notes.flatMap((n) => wrap(n, columns));
    const height = Math.max(0, rows - wands.length - 5);
    view.depth = Math.min(view.depth, Math.max(0, wrapped.length - height));
    const [upper, lower] = logo().lines();
    const top = [
      `${upper} ${status.text()}`,
      lower,
      ...wands.map(([, l]) => `${l.head}${' '.repeat(width - stripVTControlCharacters(l.head).length)}  ${styleText(['', 'idle'].includes(stripVTControlCharacters(l.head)) ? 'gray' : 'green', duration(Date.now() - l.start).clock(), { validateStream: false })}  ${l.tail}`),
      '-'.repeat(10),
      ...wrapped.slice(Math.max(0, wrapped.length - height - view.depth), wrapped.length - view.depth)
    ];
    stream.write(
      `\x1b[H${
        [...top, ...Array(Math.max(1, rows - top.length - 1)).fill(''), edge(legend.text(), columns)]
          .map((l) => `\x1b[2K${sliceAnsi(l, 0, columns)}\x1b[0m`)
          .join('\n')
      }\x1b[J`
    );
  };
  const redraw = () => {
    if (clock.length > 0) {
      draw();
    }
  };
  const paint = () => {
    if (clock.length === 0) {
      stream.write('\x1b[?1049h\x1b[?25l\x1b[?1007h');
      clock.push(setInterval(() => draw(), 1000).unref());
      stream.on('resize', () => redraw());
    }
    draw();
  };
  const update = (index, text) => {
    const [head, tail = ''] = text.split('\t');
    const line = lines.get(index) ?? { head: '', start: Date.now() };
    lines.set(index, { head, tail, start: head === line.head ? line.start : Date.now() });
    paint();
  };
  const note = (level, text) => {
    notes.push(
      `${level === 'warn' ? `\x1b[38;2;255;135;0m${new Date().toTimeString().slice(0, 8)}\x1b[39m` : new Date().toTimeString().slice(0, 8)} ${text.replace(/https:\/\/github\.com\/([^/\s]+\/[^/\s]+)\/(?:issues|pull)\/(\d+)/g, (url, repo, number) => `\x1b]8;;${url}\x07\x1b[38;2;106;113;247m${repo}#${number}\x1b[39m\x1b]8;;\x07`)}`
    );
    if (view.depth > 0) {
      view.depth += wrap(notes.at(-1), stream.columns || 80).length;
    }
    paint();
  };
  return Object.freeze({
    row: (index) => row({ push: ([i, text]) => update(i, text) }, index),
    notice: () => protocol({ push: ([level, text]) => note(level, text) }),
    up: () => {
      view.depth += 1;
      redraw();
    },
    down: () => {
      view.depth = Math.max(0, view.depth - 1);
      redraw();
    },
    close: () => {
      clock.splice(0).forEach((c) => {
        clearInterval(c);
        stream.write('\x1b[?1007l\x1b[?25h\x1b[?1049l');
        stream.write(notes.map((n) => `${n}\n`).join(''));
      });
    }
  });
};
