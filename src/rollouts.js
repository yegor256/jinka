// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const rollouts = (origin, dir) => {
  const files = new Map();
  let thread = '';
  const limits = () => {
    if (!files.has(thread) && existsSync(dir)) {
      readdirSync(dir, { recursive: true })
        .map(String)
        .filter((path) => path.endsWith(`-${thread}.jsonl`))
        .forEach((path) => files.set(thread, path));
    }
    return !files.has(thread)
      ? []
      : readFileSync(join(dir, files.get(thread)), 'utf8')
        .split('\n')
        .filter((text) => text.includes('"rate_limits"'))
        .map((text) => JSON.parse(text).payload?.rate_limits)
        .filter((l) => typeof l === 'object' && l !== null)
        .slice(-1);
  };
  return Object.freeze({
    add: (line) => {
      origin.add(line);
      try {
        const json = JSON.parse(line);
        if (json.type === 'thread.started' && typeof json.thread_id === 'string') {
          thread = json.thread_id;
        }
        if ((json.type === 'turn.completed' || json.type === 'item.completed') && thread !== '') {
          limits().forEach((l) => origin.add(JSON.stringify({
            type: 'rate_limit_event',
            rate_limit_info: {
              unifiedWindows: Object.fromEntries(
                [l.primary, l.secondary]
                  .filter((w) => typeof w?.used_percent === 'number' && typeof w?.window_minutes === 'number')
                  .map((w) => [{ 300: 'five_hour', 10080: 'seven_day', 43200: 'thirty_day' }[w.window_minutes] ?? `${w.window_minutes}_minute`, { utilization: w.used_percent / 100, resetsAt: w.resets_at }])
              )
            }
          })));
        }
      } catch {
        return;
      }
    }
  });
};
