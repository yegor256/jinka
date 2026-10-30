// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

/**
 * The bottom line of the terminal screen.
 * It tells which key does what, depending on whether the freeze is on.
 */
export class Legend {
  constructor(freeze) {
    this.freeze = freeze;
  }
  text() {
    return this.freeze.active() ? 'C - to continue' : 'F - to finish and quit';
  }
}
