// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const quota = () => {
  const windows = [];
  const live = (now) => (windows.at(-1) ?? [])
    .filter(([, w]) => typeof w.resetsAt !== 'number' || w.resetsAt * 1000 > now)
    .map(([n, w]) => [n.replaceAll('_', '-'), (1 - w.utilization) * 100]);
  const tightest = (now) => live(now).reduce((a, b) => (b[1] < a[1] ? b : a), ['', 100]);
  return Object.freeze({
    add: (line) => {
      try {
        const json = JSON.parse(line);
        if (json.type === 'rate_limit_event' && typeof json.rate_limit_info?.unifiedWindows === 'object') {
          windows.push(Object.entries(json.rate_limit_info.unifiedWindows).filter(([, w]) => typeof w?.utilization === 'number'));
        }
      } catch {
        return;
      }
    },
    text: (now) => live(now)
      .map(([n, share]) => `${Math.round(share)}%-${{ 'five-hour': '5H', 'seven-day': 'W', 'thirty-day': 'M', 'seven-day-overage-included': 'W+' }[n] ?? n}`)
      .join(',') || '-',
    left: (now) => tightest(now)[1],
    name: (now) => tightest(now)[0]
  });
};
