// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

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
