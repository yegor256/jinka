// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Quota {
  constructor() {
    this.shares = [];
  }
  add(line) {
    try {
      const json = JSON.parse(line);
      if (json.type === 'rate_limit_event' && typeof json.rate_limit_info?.unifiedWindows?.five_hour?.utilization === 'number') {
        this.shares.push(json.rate_limit_info.unifiedWindows.five_hour.utilization);
      }
    } catch {
      return;
    }
  }
  text() {
    return this.shares.length === 0 ? '-' : `${Math.round((1 - this.shares.at(-1)) * 100)}%`;
  }
}
