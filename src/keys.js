// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

/**
 * The keyboard of the terminal, read one raw key press at a time.
 * The F key turns the freeze on, the C key turns it off, in either
 * case, the plus key adds one wand to the crew, the minus key retires
 * one idle wand, and Ctrl+C interrupts jinka, since the terminal in raw mode
 * no longer turns it into a signal. A stream that is not a terminal,
 * such as a pipe, is read as is, which lets a parent process
 * interrupt jinka where there are no POSIX signals.
 */
export class Keys {
  constructor(stream, freeze, crew, interrupt) {
    this.stream = stream;
    this.freeze = freeze;
    this.crew = crew;
    this.interrupt = interrupt;
  }
  listen() {
    if (this.stream.isTTY) {
      this.stream.setRawMode(true);
    }
    this.stream.on('data', (chunk) => [...chunk.toString()].forEach((k) => this.#press(k)));
  }
  #press(key) {
    ({
      f: () => this.freeze.on(),
      F: () => this.freeze.on(),
      c: () => this.freeze.off(),
      C: () => this.freeze.off(),
      '+': () => this.crew.more(),
      '-': () => this.crew.less(),
      '\x03': () => this.interrupt()
    })[key]?.();
  }
}
