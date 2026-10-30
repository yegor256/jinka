// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Row } from './row.js';

/**
 * The screen for anything that is not a terminal, such as CI or a pipe.
 * It prints every change of every row as a new plain line,
 * without any cursor movement.
 */
export class Log {
  constructor(stream) {
    this.stream = stream;
  }
  row(index) {
    return new Row({ push: ([i, text]) => this.stream.write(`[${i + 1}] ${text.replace('\t', '  ')}\n`) }, index);
  }
}
