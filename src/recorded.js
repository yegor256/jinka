// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const recorded = (origin, dir) => {
  let thread = '';
  return Object.freeze({
    add: (line) => {
      origin.add(line);
      try {
        const json = JSON.parse(line);
        if (json.type === 'thread.started' && typeof json.thread_id === 'string') {
          thread = json.thread_id;
        }
        if (json.type === 'turn.completed' && thread !== '' && existsSync(dir)) {
          readdirSync(dir, { recursive: true })
            .map(String)
            .filter((path) => path.endsWith(`-${thread}.jsonl`))
            .flatMap((path) => readFileSync(join(dir, path), 'utf8').split('\n'))
            .filter((text) => text.includes('"turn_context"'))
            .map((text) => JSON.parse(text).payload?.model)
            .filter((name) => typeof name === 'string')
            .slice(-1)
            .forEach((name) => origin.add(JSON.stringify({ type: 'system', subtype: 'init', model: name })));
        }
      } catch {
        return;
      }
    },
    text: () => origin.text()
  });
};
