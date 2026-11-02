// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Claude {
  constructor(agent, model, effort, plugin) {
    this.agent = agent;
    this.model = model;
    this.effort = effort;
    this.plugin = plugin;
  }
  start(args, signal) {
    return this.agent.start(
      [
        '-p', '--output-format', 'stream-json', '--verbose',
        '--plugin-dir', this.plugin,
        ...args,
        '--dangerously-skip-permissions',
        ...(this.model === '' ? [] : ['--model', this.model]),
        ...(this.effort === '' ? [] : ['--effort', this.effort])
      ],
      signal
    );
  }
  lines() {
    return [];
  }
}
