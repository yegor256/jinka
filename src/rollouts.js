// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export class Rollouts {
  constructor(origin, dir) {
    this.origin = origin;
    this.dir = dir;
    this.files = new Map();
    this.thread = '';
  }
  add(line) {
    this.origin.add(line);
    try {
      const json = JSON.parse(line);
      if (json.type === 'thread.started' && typeof json.thread_id === 'string') {
        this.thread = json.thread_id;
      }
      if ((json.type === 'turn.completed' || json.type === 'item.completed') && this.thread !== '') {
        this.#limits().forEach((limits) => this.origin.add(JSON.stringify({
          type: 'rate_limit_event',
          rate_limit_info: {
            unifiedWindows: Object.fromEntries(
              [limits.primary, limits.secondary]
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
  #limits() {
    if (!this.files.has(this.thread) && existsSync(this.dir)) {
      readdirSync(this.dir, { recursive: true })
        .map(String)
        .filter((path) => path.endsWith(`-${this.thread}.jsonl`))
        .forEach((path) => this.files.set(this.thread, path));
    }
    return !this.files.has(this.thread)
      ? []
      : readFileSync(join(this.dir, this.files.get(this.thread)), 'utf8')
        .split('\n')
        .filter((text) => text.includes('"rate_limits"'))
        .map((text) => JSON.parse(text).payload?.rate_limits)
        .filter((limits) => typeof limits === 'object' && limits !== null)
        .slice(-1);
  }
}
