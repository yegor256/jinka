// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Permanent {
  constructor(origin) {
    this.origin = origin;
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
    this.origin.free();
  }
  free() {
    this.origin.free();
  }
}
