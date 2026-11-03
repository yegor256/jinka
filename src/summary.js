// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { sep } from 'node:path';
import { Duration } from './duration.js';

export class Summary {
  constructor(start, version, jobs, setup) {
    this.start = start;
    this.version = version;
    this.jobs = jobs;
    this.setup = setup;
  }
  text() {
    return [
      '---',
      `jinka ${this.version} finished in ${new Duration(Date.now() - this.start).hours()}`,
      `agent: ${this.setup.agent}, model: ${this.setup.model === '' ? 'default' : this.setup.model}, effort: ${this.setup.effort === '' ? 'default' : this.setup.effort}`,
      `sessions finished: ${this.jobs.text()}`,
      `wishes remained in ${this.setup.wishes.startsWith(`${homedir()}${sep}`) ? `~${this.setup.wishes.slice(homedir().length)}` : this.setup.wishes}: ${existsSync(this.setup.wishes) ? readdirSync(this.setup.wishes, { recursive: true, withFileTypes: true }).filter((f) => f.isFile() && f.name.endsWith('.md')).length : 0}`,
      ''
    ].join('\n');
  }
}
