// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Legend {
  constructor(freeze) {
    this.freeze = freeze;
  }
  text() {
    return this.freeze.active() ? 'C - to continue' : 'F - to finish and quit, +/- to add threads';
  }
}
