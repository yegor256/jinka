// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { styleText } from 'node:util';
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
    this.row.show(`${styleText('gray', 'idle', { validateStream: false })}\t${styleText('gray', 'waiting for wishes', { validateStream: false })}`);
    const wish = await this.wishes.next(signal);
    this.row.show(`${wish.name()}\tstarting the agent`);
    const start = Date.now();
    const { code, summary, link = '', tokens, model } = await this.agent.run(wish, { show: (text) => this.row.show(`${wish.name()}\t${text}`) }, signal);
    const suffix = [`(${[wish.name(), new Duration(Date.now() - start).minutes(), tokens, model].filter((p) => p !== '').join(' ')})`, link].filter((p) => p !== '').join(' ');
    if (code === 0) {
      await wish.close();
      this.protocol.info(`${summary === '' ? 'done' : summary} ${suffix}`);
    } else {
      wish.free();
      this.protocol.info(`failed with exit code ${code}${summary === '' ? '' : `: ${summary}`} ${suffix}`);
    }
  }
}
