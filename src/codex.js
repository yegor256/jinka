// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { join } from 'node:path';

export class Codex {
  constructor(agent, model, effort, plugin) {
    this.agent = agent;
    this.model = model;
    this.effort = effort;
    this.plugin = plugin;
  }
  start(args, signal) {
    return this.agent.start(
      [
        'exec', '--json',
        '--dangerously-bypass-approvals-and-sandbox', '--skip-git-repo-check',
        ...args,
        ...(this.model === '' ? [] : ['--model', this.model]),
        ...(this.effort === '' ? [] : ['--config', `model_reasoning_effort=${this.effort}`]),
        '-'
      ],
      signal
    );
  }
  lines() {
    return [
      `Your skills live in the directory ${join(this.plugin, 'skills')}, one skill per subdirectory, each described in its SKILL.md file.`,
      'Before you start, read the descriptions of these skills, and whenever a skill fits your work, read its SKILL.md file and follow it.'
    ];
  }
}
