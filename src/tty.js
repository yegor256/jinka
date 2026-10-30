// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Row } from './row.js';
import { Duration } from './duration.js';

/**
 * The screen for terminals, which takes over the whole terminal like top.
 * It switches to the alternate buffer and draws a fixed layout from the
 * top left corner: the status line, an empty line, one line per wand
 * of the crew with the time it has been busy with its current wish,
 * a separator, and the newest protocol lines and notices that fit below it, while the legend with
 * the keys stays on the last row, under an empty line. The layout is redrawn on every change,
 * every second, and on every resize, until the screen is closed and the
 * normal buffer comes back, where the whole protocol is printed line by
 * line, so it stays in the console after jinka quits.
 */
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
  protocol(index) {
    return new Row({ push: ([i, text]) => this.#note(`[${i + 1}] ${text.replace('\t', '  ')}`) }, index);
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
    this.notes.push(`${new Date().toTimeString().slice(0, 8)} ${text}`);
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
    const top = [
      this.status.text(),
      '',
      ...lines.map(([i, l]) => `[${i + 1}] ${l.head.padEnd(width)}  ${new Duration(Date.now() - l.start).minutes()}  ${l.tail}`),
      '-'.repeat(10),
      ...this.notes.slice(Math.max(0, this.notes.length - Math.max(0, rows - lines.length - 5)))
    ];
    this.stream.write(
      `\x1b[H${
        [...top, ...Array(Math.max(1, rows - top.length - 1)).fill(''), this.legend.text()]
          .map((l) => `\x1b[2K${l.slice(0, this.stream.columns || 80)}`)
          .join('\n')
      }\x1b[J`
    );
  }
}
