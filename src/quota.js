// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Quota {
  constructor() {
    this.windows = [];
  }
  add(line) {
    try {
      const json = JSON.parse(line);
      if (json.type === 'rate_limit_event' && typeof json.rate_limit_info?.unifiedWindows === 'object') {
        this.windows.push(Object.entries(json.rate_limit_info.unifiedWindows).filter(([, w]) => typeof w?.utilization === 'number'));
      }
    } catch {
      return;
    }
  }
  text(now) {
    return this.name(now) === '' ? '-' : `${Math.round(this.left(now))}%`;
  }
  left(now) {
    return this.#tightest(now)[1];
  }
  name(now) {
    return this.#tightest(now)[0];
  }
  #tightest(now) {
    return (this.windows.at(-1) ?? [])
      .filter(([, w]) => typeof w.resetsAt !== 'number' || w.resetsAt * 1000 > now)
      .map(([n, w]) => [n.replaceAll('_', '-'), (1 - w.utilization) * 100])
      .reduce((a, b) => (b[1] < a[1] ? b : a), ['', 100]);
  }
}
