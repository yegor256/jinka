// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Freeze {
  constructor(crew, notice, quit) {
    this.crew = crew;
    this.notice = notice;
    this.quit = quit;
    this.state = { frozen: false, idle: 0 };
    this.waiters = [];
  }
  on() {
    this.state.frozen = true;
    this.notice.warn('finishing, now we wait for all jobs to finish and then quit');
    this.#check();
  }
  off() {
    this.state.frozen = false;
    this.notice.warn('continuing, new jobs will start again');
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
    if (this.state.frozen && this.state.idle === this.crew.size()) {
      this.quit();
    }
  }
}
