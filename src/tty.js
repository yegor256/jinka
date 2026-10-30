// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { stripVTControlCharacters } from 'node:util';
import sliceAnsi from 'slice-ansi';
import { Row } from './row.js';
import { Duration } from './duration.js';

export class Tty {
  constructor(stream, crew, status, legend) {
    this.stream = stream;
    this.crew = crew;
    this.status = status;
    this.legend = legend;
    this.lines = new Map();
    this.notes = [];
    this.clock = [];
  }
  row(index) {
    return new Row({ push: ([i, text]) => this.#update(i, text) }, index);
  }
  notice() {
    return new Row({ push: ([, text]) => this.#note(text) }, 0);
  }
  close() {
    this.clock.splice(0).forEach((c) => {
      clearInterval(c);
      this.stream.write('\x1b[?25h\x1b[?1049l');
      this.stream.write(this.notes.map((n) => `${n}\n`).join(''));
    });
  }
  #update(index, text) {
    const [head, tail = ''] = text.split('\t');
    const line = this.lines.get(index) ?? { head: '', start: Date.now() };
    this.lines.set(index, { head, tail, start: head === line.head ? line.start : Date.now() });
    this.#paint();
  }
  #note(text) {
    this.notes.push(
      `${new Date().toTimeString().slice(0, 8)} ${text.replace(/https:\/\/github\.com\/([^/\s]+\/[^/\s]+)\/(?:issues|pull)\/(\d+)/g, (url, repo, number) => `\x1b]8;;${url}\x07${repo}#${number}\x1b]8;;\x07`)}`
    );
    this.#paint();
  }
  #paint() {
    if (this.clock.length === 0) {
      this.stream.write('\x1b[?1049h\x1b[?25l');
      this.clock.push(setInterval(() => this.#draw(), 1000).unref());
      this.stream.on('resize', () => {
        if (this.clock.length > 0) {
          this.#draw();
        }
      });
    }
    this.#draw();
  }
  #draw() {
    const rows = this.stream.rows || 24;
    const lines = this.crew.indexes().map((i) => [i, this.lines.get(i) ?? { head: '', tail: '', start: Date.now() }]);
    const width = Math.max(...lines.map(([, l]) => l.head.length));
    const columns = this.stream.columns || 80;
    const notes = this.notes.flatMap((n) => this.#wrap(n, columns));
    const top = [
      this.status.text(),
      '',
      ...lines.map(([i, l]) => `[${i + 1}] ${l.head.padEnd(width)}  ${new Duration(Date.now() - l.start).minutes()}  ${l.tail}`),
      '-'.repeat(10),
      ...notes.slice(Math.max(0, notes.length - Math.max(0, rows - lines.length - 5)))
    ];
    this.stream.write(
      `\x1b[H${
        [...top, ...Array(Math.max(1, rows - top.length - 1)).fill(''), this.legend.text()]
          .map((l) => `\x1b[2K${sliceAnsi(l, 0, columns)}\x1b[0m`)
          .join('\n')
      }\x1b[J`
    );
  }
  #wrap(text, width) {
    return stripVTControlCharacters(text).length <= width || width < 3 ? [text] : [sliceAnsi(text, 0, width), ...this.#wrap(`  ${sliceAnsi(text, width)}`, width)];
  }
}
