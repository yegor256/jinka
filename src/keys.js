// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

/**
 * The keyboard of the terminal, read one raw key press at a time.
 * The F key turns the freeze on, the C key turns it off, in either
 * case, and Ctrl+C interrupts jinka, since the terminal in raw mode
 * no longer turns it into a signal.
 */
export class Keys {
  constructor(stream, freeze, interrupt) {
    this.stream = stream;
    this.freeze = freeze;
    this.interrupt = interrupt;
  }
  listen() {
    this.stream.setRawMode(true);
    this.stream.on('data', (chunk) => [...chunk.toString()].forEach((k) => this.#press(k)));
  }
  #press(key) {
    ({
      f: () => this.freeze.on(),
      F: () => this.freeze.on(),
      c: () => this.freeze.off(),
      C: () => this.freeze.off(),
      '\x03': () => this.interrupt()
    })[key]?.();
  }
}
