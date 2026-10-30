// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

/**
 * One loop that keeps making wishes come true until the signal aborts.
 * It takes the next free wish, shows it on its own screen row, runs the
 * agent on it, and closes the wish when the agent succeeds or frees it
 * for a later retry when the agent fails.
 */
export class Wand {
  constructor(wishes, agent, row) {
    this.wishes = wishes;
    this.agent = agent;
    this.row = row;
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
    if (await this.agent.run(wish, { show: (text) => this.row.show(`${wish.name()}\t${text}`) }, signal) === 0) {
      await wish.close();
    } else {
      wish.free();
    }
  }
}
