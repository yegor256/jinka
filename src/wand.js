// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { styleText } from 'node:util';
import { duration } from './duration.js';
import { ellipsized } from './ellipsized.js';

export const wand = (wishes, agent, row, protocol) => {
  const once = async (signal) => {
    row.show(`${styleText('gray', 'idle', { validateStream: false })}\t${styleText('gray', 'waiting for wishes', { validateStream: false })}`);
    const wish = await wishes.next(signal);
    row.show(`${ellipsized(wish.name(), 64).text()}\tstarting the agent`);
    const start = Date.now();
    const { code, summary, link = '', tokens, model } = await agent.run(wish, { show: (text) => row.show(`${ellipsized(wish.name(), 64).text()}\t${text}`) }, signal);
    const suffix = [`(${[wish.name(), duration(Date.now() - start).minutes(), tokens, model].filter((p) => p !== '').join(' ')})`, link].filter((p) => p !== '').join(' ');
    if (code === 0) {
      await wish.close();
      protocol.info(`${summary === '' ? 'done' : summary} ${suffix}`);
    } else {
      wish.free();
      protocol.info(`failed with exit code ${code}${summary === '' ? '' : `: ${summary}`} ${suffix}`);
    }
  };
  return Object.freeze({
    run: async (signal) => {
      try {
        while (!signal.aborted) {
          await once(signal);
        }
      } catch (e) {
        if (!signal.aborted) {
          throw e;
        }
      }
    }
  });
};
