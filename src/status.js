// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { styleText } from 'node:util';
import { Duration } from './duration.js';

export class Status {
  constructor(version, start, jobs, agent, model, tokens, quota) {
    this.version = version;
    this.start = start;
    this.jobs = jobs;
    this.agent = agent;
    this.model = model;
    this.tokens = tokens;
    this.quota = quota;
  }
  text() {
    return [
      `jinka ${styleText('bgGray', this.version, { validateStream: false })}`,
      `up ${styleText('bgGray', new Duration(Date.now() - this.start).hours(), { validateStream: false })}`,
      `done ${styleText('bgGray', this.jobs.text(), { validateStream: false })}`,
      `agent ${styleText('bgGray', this.agent, { validateStream: false })}`,
      `model ${styleText('bgGray', this.model === '' ? 'default' : this.model, { validateStream: false })}`,
      `tokens ${styleText('bgGray', this.tokens.text(), { validateStream: false })}`,
      `5h-quota ${styleText('bgGray', this.quota.text(), { validateStream: false })}`
    ].join(', ');
  }
}
