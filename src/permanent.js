// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Permanent {
  constructor(origin, pause) {
    this.origin = origin;
    this.pause = pause;
  }
  name() {
    return this.origin.name();
  }
  async text() {
    return this.origin.text();
  }
  fate() {
    return 'which stays there after you exit, so you must not delete it';
  }
  async close() {
    setTimeout(() => this.origin.free(), this.pause).unref();
  }
  free() {
    this.origin.free();
  }
}
