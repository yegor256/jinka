// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Crew {
  constructor(size, limit, notice) {
    this.limit = limit;
    this.notice = notice;
    this.seats = new Map(Array.from({ length: size }, (_, i) => [i, { idle: false, controller: new AbortController() }]));
    this.state = { launch: () => {}, runs: [] };
  }
  size() {
    return this.seats.size;
  }
  indexes() {
    return [...this.seats.keys()].sort((a, b) => a - b);
  }
  more() {
    if (this.seats.size >= this.limit) {
      this.notice.show(`more than ${this.limit} threads are not allowed`);
      return;
    }
    const index = Array.from({ length: this.limit }, (_, i) => i).find((i) => !this.seats.has(i));
    this.seats.set(index, { idle: false, controller: new AbortController() });
    this.state.launch(index);
  }
  less() {
    const index = this.indexes().findLast((i) => this.seats.get(i).idle);
    if (this.seats.size === 1) {
      this.notice.show('the last thread cannot be removed');
    } else if (index === undefined) {
      this.notice.show('no idle thread can be removed right now');
    } else {
      this.seats.get(index).controller.abort();
      this.seats.delete(index);
    }
  }
  async run(wishes, wand, signal) {
    this.state.launch = (index) => {
      const seat = this.seats.get(index);
      this.state.runs.push(
        wand(
          index,
          {
            next: async (s) => {
              seat.idle = true;
              try {
                return await wishes.next(s);
              } finally {
                seat.idle = false;
              }
            }
          },
          AbortSignal.any([signal, seat.controller.signal])
        )
      );
    };
    this.indexes().forEach((i) => this.state.launch(i));
    await this.#join(0);
  }
  async #join(from) {
    const to = this.state.runs.length;
    if (from < to) {
      await Promise.all(this.state.runs.slice(from, to));
      await this.#join(to);
    }
  }
}
