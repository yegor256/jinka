// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Wand } from './wand.js';

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
      (i, wishes, s) => new Wand(wishes, this.agent, this.screen.row(i), this.screen.notice()).run(s),
      signal
    );
  }
}
