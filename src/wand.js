// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Duration } from './duration.js';

export class Wand {
  constructor(wishes, agent, row, protocol) {
    this.wishes = wishes;
    this.agent = agent;
    this.row = row;
    this.protocol = protocol;
  }
  async run(signal) {
    try {
      while (!signal.aborted) {
        await this.#once(signal);
      }
    } catch (e) {
      if (!signal.aborted) {
        throw e;
      }
    }
  }
  async #once(signal) {
    this.row.show('idle\twaiting for wishes');
    const wish = await this.wishes.next(signal);
    this.row.show(`${wish.name()}\tstarting the agent`);
    const start = Date.now();
    const { code, summary } = await this.agent.run(wish, { show: (text) => this.row.show(`${wish.name()}\t${text}`) }, signal);
    const tail = summary === '' ? '' : `: ${summary}`;
    if (code === 0) {
      await wish.close();
      this.protocol.show(`${wish.name()}\tdone in ${new Duration(Date.now() - start).minutes()}${tail}`);
    } else {
      wish.free();
      this.protocol.show(`${wish.name()}\tfailed with exit code ${code} after ${new Duration(Date.now() - start).minutes()}${tail}`);
    }
  }
}
