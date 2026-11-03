// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Summarized {
  constructor(screen, summary, stream) {
    this.screen = screen;
    this.summary = summary;
    this.stream = stream;
    this.done = [];
  }
  row(index) {
    return this.screen.row(index);
  }
  notice() {
    return this.screen.notice();
  }
  up() {
    this.screen.up();
  }
  down() {
    this.screen.down();
  }
  close() {
    this.screen.close();
    if (this.done.length === 0) {
      this.done.push(true);
      this.stream.write(this.summary.text());
    }
  }
}
