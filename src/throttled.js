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
    if (left >= this.throttle) {
      this.notice.warn(`checked the quota again, ${Math.round(left)}% is left, which is not below ${this.throttle}%, so new jobs resume`);
      return;
    }
    if (first) {
      this.notice.warn(`only ${Math.round(left)}% of the quota is left, which is below ${this.throttle}%, so new jobs wait and the quota is checked again in ${new Duration(this.interval).minutes()}`);
    } else {
      this.notice.warn(`checked the quota again, only ${Math.round(left)}% is left, which is still below ${this.throttle}%, so new jobs wait and the quota is checked again in ${new Duration(this.interval).minutes()}`);
    }
    await setTimeout(this.interval, undefined, { signal });
    await this.#wait(signal, false);
  }
}
