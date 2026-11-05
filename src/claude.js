// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const claude = (agent, model, effort, plugin) => Object.freeze({
  start: (args, signal) => agent.start(
    [
      '-p', '--output-format', 'stream-json', '--verbose',
      '--plugin-dir', plugin,
      ...args,
      '--dangerously-skip-permissions',
      ...(model === '' ? [] : ['--model', model]),
      ...(effort === '' ? [] : ['--effort', effort])
    ],
    signal
  ),
  lines: () => []
});
