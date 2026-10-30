// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Duration } from './duration.js';

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
