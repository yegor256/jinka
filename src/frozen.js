// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

/**
 * The directory of wishes that gives nothing out while the freeze is on.
 * A wand that asks for a wish counts as idle until it gets one, and
 * a wish that arrives after the freeze turned on is freed for later,
 * so no new wish starts while jinka is finishing.
 */
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
