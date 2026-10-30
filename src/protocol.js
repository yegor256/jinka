// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Protocol {
  constructor(lines) {
    this.lines = lines;
  }
  info(text) {
    this.lines.push(['info', text]);
  }
  warn(text) {
    this.lines.push(['warn', text]);
  }
}
