// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { setTimeout } from 'node:timers/promises';
import { duration } from './duration.js';

export const throttled = (origin, quota, throttle, interval, notice) => {
  const wait = async (signal, first) => {
    signal.throwIfAborted();
    const left = quota.left(Date.now());
    if (left >= throttle && first) {
      return;
    }
    const share = `${Math.round(left)}% of the ${quota.name(Date.now())} quota is left`;
    if (left >= throttle) {
      notice.warn(`now ${share}, not below ${throttle}%, new jobs resume`);
      return;
    }
    notice.warn(`${first ? '' : 'still '}only ${share}, below ${throttle}%, new jobs wait, next check in ${duration(interval).phrase()}`);
    await setTimeout(interval, undefined, { signal });
    await wait(signal, false);
  };
  return Object.freeze({
    next: async (signal) => {
      await wait(signal, true);
      return origin.next(signal);
    }
  });
};
