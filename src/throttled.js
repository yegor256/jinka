// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { setTimeout } from 'node:timers/promises';
import { Duration } from './duration.js';

export class Throttled {
  constructor(origin, quota, throttle, interval, notice) {
    this.origin = origin;
    this.quota = quota;
    this.throttle = throttle;
    this.interval = interval;
    this.notice = notice;
  }
  async next(signal) {
    await this.#wait(signal, true);
    return this.origin.next(signal);
  }
  async #wait(signal, first) {
    signal.throwIfAborted();
    const left = this.quota.left(Date.now());
    if (left >= this.throttle && first) {
      return;
    }
    const share = `${Math.round(left)}% of the ${this.quota.name(Date.now())} quota is left`;
    if (left >= this.throttle) {
      this.notice.warn(`now ${share}, not below ${this.throttle}%, new jobs resume`);
      return;
    }
    this.notice.warn(`${first ? '' : 'still '}only ${share}, below ${this.throttle}%, new jobs wait, next check in ${new Duration(this.interval).phrase()}`);
    await setTimeout(this.interval, undefined, { signal });
    await this.#wait(signal, false);
  }
}
