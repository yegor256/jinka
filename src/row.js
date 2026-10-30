// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Row {
  constructor(lines, index) {
    this.lines = lines;
    this.index = index;
  }
  show(text) {
    this.lines.push([this.index, text]);
  }
}
