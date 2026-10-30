// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Duration } from './duration.js';

/**
 * One loop that keeps making wishes come true until the signal aborts.
 * It takes the next free wish, shows it on its own screen row, runs the
 * agent on it, and closes the wish when the agent succeeds or frees it
 * for a later retry when the agent fails. Either way, it reports the
 * outcome and the time it took to the protocol of the screen.
 */
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
    const code = await this.agent.run(wish, { show: (text) => this.row.show(`${wish.name()}\t${text}`) }, signal);
    if (code === 0) {
      await wish.close();
      this.protocol.show(`${wish.name()}\tdone in ${new Duration(Date.now() - start).minutes()}`);
    } else {
      wish.free();
      this.protocol.show(`${wish.name()}\tfailed with exit code ${code} after ${new Duration(Date.now() - start).minutes()}`);
    }
  }
}
