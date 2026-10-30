// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

/**
 * The switch that stops wands from taking new wishes, shared by all of them.
 * While it is on, idle wands wait for it to turn off, and busy wands
 * keep making their wishes come true. It counts the idle wands, and
 * quits once it is on and every wand is idle, because then all the
 * running wishes are finished and nothing else will start.
 */
export class Freeze {
  constructor(threads, quit) {
    this.threads = threads;
    this.quit = quit;
    this.state = { frozen: false, idle: 0 };
    this.waiters = [];
  }
  on() {
    this.state.frozen = true;
    this.#check();
  }
  off() {
    this.state.frozen = false;
    this.waiters.splice(0).forEach((w) => w());
  }
  active() {
    return this.state.frozen;
  }
  enter() {
    this.state.idle += 1;
    this.#check();
  }
  leave() {
    this.state.idle -= 1;
  }
  async thaw(signal) {
    signal.throwIfAborted();
    if (this.state.frozen) {
      await new Promise((resolve, reject) => {
        this.waiters.push(resolve);
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    }
  }
  #check() {
    if (this.state.frozen && this.state.idle === this.threads) {
      this.quit();
    }
  }
}
