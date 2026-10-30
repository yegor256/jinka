// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Duration } from './duration.js';

/**
 * The top line of the terminal screen.
 * It tells which version of jinka is running and how long it has been
 * alive since the moment it started.
 */
export class Status {
  constructor(version, start) {
    this.version = version;
    this.start = start;
  }
  text() {
    return `jinka ${this.version}, up ${new Duration(Date.now() - this.start).hours()}`;
  }
}
