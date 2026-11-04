// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Ellipsized {
  constructor(origin, limit) {
    this.origin = origin;
    this.limit = limit;
  }
  text() {
    return this.origin.length < this.limit
      ? this.origin
      : `${this.origin.slice(0, Math.floor((this.limit - 2) / 2))}…${this.origin.slice(-Math.ceil((this.limit - 2) / 2))}`;
  }
}
