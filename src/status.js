// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Duration } from './duration.js';

/**
 * The top line of the terminal screen.
 * It tells which version of jinka is running, how long it has been
 * alive since the moment it started, which model the agents use,
 * where an empty model means the default one of the agent, and how many
 * tokens all agents have spent so far.
 */
export class Status {
  constructor(version, start, model, tokens) {
    this.version = version;
    this.start = start;
    this.model = model;
    this.tokens = tokens;
  }
  text() {
    return `jinka ${this.version}, up ${new Duration(Date.now() - this.start).hours()}, model ${this.model === '' ? 'default' : this.model}, tokens ${this.tokens.text()}`;
  }
}
