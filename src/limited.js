// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Limited {
  constructor(origin, limit, freeze) {
    this.origin = origin;
    this.limit = limit;
    this.freeze = freeze;
    this.state = { given: 0 };
  }
  async next(signal) {
    const wish = await this.origin.next(signal);
    this.state.given += 1;
    if (this.state.given >= this.limit) {
      this.freeze.on();
    }
    return wish;
  }
}
