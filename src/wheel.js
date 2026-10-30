// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Wheel {
  constructor(stream, screen) {
    this.stream = stream;
    this.screen = screen;
  }
  listen() {
    this.stream.on('data', (chunk) =>
      chunk
        .toString()
        .split('\x1b')
        .slice(1)
        .map((s) => s.slice(0, 2))
        .filter((s) => /^[[O][AB]$/.test(s))
        .forEach((s) => (s.endsWith('A') ? this.screen.up() : this.screen.down()))
    );
  }
}
