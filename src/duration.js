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
  clock() {
    const minutes = Math.floor(this.millis / 60_000);
    if (minutes < 1000) {
      return this.minutes().padStart(6);
    }
    if (minutes < 6000) {
      return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}m`;
    }
    return `${Math.floor(minutes / 60)}h`.padStart(6);
  }
  phrase() {
    const seconds = Math.floor(this.millis / 1000);
    const [count, unit] = seconds < 60 ? [seconds, 'second'] : [Math.floor(seconds / 60), 'minute'];
    return `${count} ${unit}${count === 1 ? '' : 's'}`;
  }
  hours() {
    const seconds = Math.floor(this.millis / 1000);
    return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((p) => String(p).padStart(2, '0')).join(':');
  }
}
