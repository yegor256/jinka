// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { readFileSync } from 'node:fs';

export const claude = (agent, model, effort, plugin) => {
  const full = (args) => [
    '-p', '--output-format', 'stream-json', '--verbose',
    '--plugin-dir', plugin,
    '--json-schema', JSON.stringify(JSON.parse(readFileSync(new URL('answer.json', import.meta.url), 'utf8'))),
    ...args,
    '--dangerously-skip-permissions',
    ...(model === '' ? [] : ['--model', model]),
    ...(effort === '' ? [] : ['--effort', effort])
  ];
  return Object.freeze({
    start: (args, signal) => agent.start(full(args), signal),
    command: (args) => agent.command(full(args)),
    lines: () => []
  });
};
