// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { sep } from 'node:path';
import { duration } from './duration.js';

export const summary = (start, version, jobs, setup) => Object.freeze({
  text: () => [
    '---',
    `jinka ${version} finished in ${duration(Date.now() - start).hours()}`,
    `agent: ${setup.agent}, model: ${setup.model === '' ? 'default' : setup.model}, effort: ${setup.effort === '' ? 'default' : setup.effort}`,
    `wishes came true: ${jobs.text()}`,
    `wishes remained in ${setup.wishes.startsWith(`${homedir()}${sep}`) ? `~${setup.wishes.slice(homedir().length)}` : setup.wishes}: ${existsSync(setup.wishes) ? readdirSync(setup.wishes, { recursive: true, withFileTypes: true }).filter((f) => f.isFile() && f.name.endsWith('.md')).length : 0}`,
    ''
  ].join('\n')
});
