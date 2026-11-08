// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { skills } from './skills.js';

export const codex = (agent, model, effort, plugin) => {
  const full = (args) => [
    'exec', '--json',
    '--dangerously-bypass-approvals-and-sandbox', '--skip-git-repo-check',
    '--output-schema', fileURLToPath(new URL('answer.json', import.meta.url)),
    ...args,
    ...(model === '' ? [] : ['--model', model]),
    ...(effort === '' ? [] : ['--config', `model_reasoning_effort=${effort}`]),
    '-'
  ];
  return Object.freeze({
    start: (args, signal) => agent.start(full(args), signal),
    command: (args) => agent.command(full(args)),
    lines: async () => [
      'These are your skills, each with its name, the path of its SKILL.md file, and its description:',
      ...(await skills(join(plugin, 'skills')).lines()),
      'Whenever a skill fits your work, read its SKILL.md file and follow it; never list the directory of skills, since every skill is named above.'
    ]
  });
};
