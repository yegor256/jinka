// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Wand } from './wand.js';

/**
 * The application, which keeps several wands busy with wishes.
 * Each wand gets its own screen row, and all of them share one
 * directory of wishes and one agent, until the signal aborts.
 */
export class Jinka {
  constructor(wishes, agent, screen, threads) {
    this.wishes = wishes;
    this.agent = agent;
    this.screen = screen;
    this.threads = threads;
  }
  async run(signal) {
    await Promise.all(
      Array.from({ length: this.threads }, (_, i) => new Wand(this.wishes, this.agent, this.screen.row(i)).run(signal))
    );
  }
}
