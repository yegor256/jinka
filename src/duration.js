// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

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
