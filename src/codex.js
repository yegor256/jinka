// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { join } from 'node:path';

export const codex = (agent, model, effort, plugin) => {
  const full = (args) => [
    'exec', '--json',
    '--dangerously-bypass-approvals-and-sandbox', '--skip-git-repo-check',
    ...args,
    ...(model === '' ? [] : ['--model', model]),
    ...(effort === '' ? [] : ['--config', `model_reasoning_effort=${effort}`]),
    '-'
  ];
  return Object.freeze({
    start: (args, signal) => agent.start(full(args), signal),
    command: (args) => agent.command(full(args)),
    lines: () => [
      `Your skills live in the directory ${join(plugin, 'skills')}, one skill per subdirectory, each described in its SKILL.md file.`,
      'Before you start, read the descriptions of these skills, and whenever a skill fits your work, read its SKILL.md file and follow it.'
    ]
  });
};
