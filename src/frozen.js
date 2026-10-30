// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Frozen {
  constructor(origin, freeze) {
    this.origin = origin;
    this.freeze = freeze;
  }
  async next(signal) {
    this.freeze.enter();
    try {
      return await this.#wish(signal);
    } finally {
      this.freeze.leave();
    }
  }
  async #wish(signal) {
    await this.freeze.thaw(signal);
    const wish = await this.origin.next(signal);
    if (this.freeze.active()) {
      wish.free();
      return this.#wish(signal);
    }
    return wish;
  }
}
