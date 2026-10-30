// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Row } from './row.js';

/**
 * The screen for terminals, which keeps one line per wand.
 * It redraws all lines in place with ANSI cursor moves, cuts them
 * to the terminal width, and shows how long each row has been busy
 * with its current wish. The cursor always stays below the lines,
 * so the terminal is clean when jinka stops.
 */
export class Tty {
  constructor(stream, threads) {
    this.stream = stream;
    this.lines = Array.from({ length: threads }, () => ({ head: '', tail: '', start: Date.now() }));
    this.clock = [];
  }
  row(index) {
    return new Row({ push: ([i, text]) => this.#update(i, text) }, index);
  }
  #update(index, text) {
    const [head, tail = ''] = text.split('\t');
    this.lines[index] = {
      head,
      tail,
      start: head === this.lines[index].head ? this.lines[index].start : Date.now()
    };
    this.#draw();
  }
  #draw() {
    if (this.clock.length === 0) {
      this.clock.push(setInterval(() => this.#draw(), 1000).unref());
    } else {
      this.stream.write(`\x1b[${this.lines.length}A`);
    }
    const width = Math.max(...this.lines.map((l) => l.head.length));
    this.stream.write(
      this.lines.map(
        (l, i) => `\r\x1b[2K${`[${i + 1}] ${l.head.padEnd(width)}  ${this.#elapsed(l.start)}  ${l.tail}`.slice(0, this.stream.columns || 80)}\n`
      ).join('')
    );
  }
  #elapsed(start) {
    const seconds = Math.floor((Date.now() - start) / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
}
