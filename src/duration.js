// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

/**
 * A span of time, printed the way a clock prints it.
 * It drops the milliseconds and pads every part with zeros, either as
 * minutes and seconds, or as hours, minutes and seconds.
 */
export class Duration {
  constructor(millis) {
    this.millis = millis;
  }
  minutes() {
    const seconds = Math.floor(this.millis / 1000);
    return [Math.floor(seconds / 60), seconds % 60].map((p) => String(p).padStart(2, '0')).join(':');
  }
  hours() {
    const seconds = Math.floor(this.millis / 1000);
    return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((p) => String(p).padStart(2, '0')).join(':');
  }
}
