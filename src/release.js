// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { styleText } from 'node:util';

export class Release {
  constructor(installed, url) {
    this.installed = installed;
    this.url = url;
    this.latest = [];
  }
  async check() {
    try {
      const res = await fetch(this.url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        this.latest.push(String((await res.json()).version));
      }
    } catch {
      return;
    }
  }
  text() {
    return this.latest.some((v) => this.#higher(v, this.installed))
      ? `${this.installed} ${styleText('red', '(old)', { validateStream: false })}`
      : this.installed;
  }
  #higher(left, right) {
    const [a, b] = [left, right].map((v) => v.split('-')[0].split('.').map(Number));
    const index = a.findIndex((n, i) => n !== (b[i] ?? 0));
    return index >= 0 && a[index] > (b[index] ?? 0);
  }
}
