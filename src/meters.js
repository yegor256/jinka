// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Meters {
  constructor(meters) {
    this.meters = meters;
  }
  add(line) {
    this.meters.forEach((meter) => meter.add(line));
  }
}
