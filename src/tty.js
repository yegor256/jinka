// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Row } from './row.js';
import { Duration } from './duration.js';

/**
 * The screen for terminals, which takes over the whole terminal like top.
 * It switches to the alternate buffer and draws a fixed layout from the
 * top left corner: the status line, an empty line, one line per wand
 * with the time it has been busy with its current wish, a separator, and
 * the newest protocol lines that fit below it, while the legend with
 * the keys stays on the last row, under an empty line. The layout is redrawn on every change,
 * every second, and on every resize, until the screen is closed and the
 * normal buffer comes back.
 */
export class Tty {
  constructor(stream, threads, status, legend) {
    this.stream = stream;
    this.status = status;
    this.legend = legend;
    this.lines = Array.from({ length: threads }, () => ({ head: '', tail: '', start: Date.now() }));
    this.notes = [];
    this.clock = [];
  }
  row(index) {
    return new Row({ push: ([i, text]) => this.#update(i, text) }, index);
  }
  protocol(index) {
    return new Row({ push: ([i, text]) => this.#note(i, text) }, index);
  }
  close() {
    this.clock.splice(0).forEach((c) => {
      clearInterval(c);
      this.stream.write('\x1b[?25h\x1b[?1049l');
    });
  }
  #update(index, text) {
    const [head, tail = ''] = text.split('\t');
    this.lines[index] = {
      head,
      tail,
      start: head === this.lines[index].head ? this.lines[index].start : Date.now()
    };
    this.#paint();
  }
  #note(index, text) {
    this.notes.push(`${new Date().toTimeString().slice(0, 8)} [${index + 1}] ${text.replace('\t', '  ')}`);
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
    this.notes.splice(0, Math.max(0, this.notes.length - Math.max(0, rows - this.lines.length - 5)));
    const width = Math.max(...this.lines.map((l) => l.head.length));
    const top = [
      this.status.text(),
      '',
      ...this.lines.map((l, i) => `[${i + 1}] ${l.head.padEnd(width)}  ${new Duration(Date.now() - l.start).minutes()}  ${l.tail}`),
      '-'.repeat(10),
      ...this.notes
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
