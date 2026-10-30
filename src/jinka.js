// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Wand } from './wand.js';

/**
 * The application, which keeps a crew of wands busy with wishes.
 * Each wand gets its own screen row and protocol, and all of them share one
 * directory of wishes and one agent, until the signal aborts.
 */
export class Jinka {
  constructor(wishes, agent, screen, crew) {
    this.wishes = wishes;
    this.agent = agent;
    this.screen = screen;
    this.crew = crew;
  }
  async run(signal) {
    await this.crew.run(
      this.wishes,
      (i, wishes, s) => new Wand(wishes, this.agent, this.screen.row(i), this.screen.protocol(i)).run(s),
      signal
    );
  }
}
