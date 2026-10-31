// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Quota {
  constructor() {
    this.shares = [];
    this.windows = [];
  }
  add(line) {
    try {
      const json = JSON.parse(line);
      if (json.type === 'rate_limit_event' && typeof json.rate_limit_info?.unifiedWindows === 'object') {
        this.windows.push(Object.values(json.rate_limit_info.unifiedWindows).filter((w) => typeof w?.utilization === 'number'));
      }
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
  left(now) {
    return Math.min(100, ...(this.windows.at(-1) ?? [])
      .filter((w) => typeof w.resetsAt !== 'number' || w.resetsAt * 1000 > now)
      .map((w) => (1 - w.utilization) * 100));
  }
}
