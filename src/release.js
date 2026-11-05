// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { styleText } from 'node:util';

export const release = (installed, url) => {
  const latest = [];
  const higher = (left, right) => {
    const [a, b] = [left, right].map((v) => v.split('-')[0].split('.').map(Number));
    const index = a.findIndex((n, i) => n !== (b[i] ?? 0));
    return index >= 0 && a[index] > (b[index] ?? 0);
  };
  return Object.freeze({
    check: async () => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          latest.push(String((await res.json()).version));
        }
      } catch {
        return;
      }
    },
    text: () => (
      latest.some((v) => higher(v, installed))
        ? `${installed} ${styleText('red', '(old)', { validateStream: false })}`
        : installed
    )
  });
};
