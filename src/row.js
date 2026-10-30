// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

/**
 * One line of the screen, owned by one wand.
 * Every text it receives goes to the screen together with the index
 * of the line, so the screen knows which line to change.
 */
export class Row {
  constructor(lines, index) {
    this.lines = lines;
    this.index = index;
  }
  show(text) {
    this.lines.push([this.index, text]);
  }
}
