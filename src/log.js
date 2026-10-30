// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { stripVTControlCharacters } from 'node:util';
import { Row } from './row.js';

export class Log {
  constructor(stream) {
    this.stream = stream;
  }
  row(index) {
    return new Row({ push: ([i, text]) => this.stream.write(`[${i + 1}] ${stripVTControlCharacters(text).replace('\t', '  ')}\n`) }, index);
  }
  protocol(index) {
    return new Row(
      { push: ([i, text]) => this.stream.write(`${new Date().toTimeString().slice(0, 8)} [${i + 1}] ${text.replace('\t', '  ')}\n`) },
      index
    );
  }
  notice() {
    return new Row({ push: ([, text]) => this.stream.write(`${new Date().toTimeString().slice(0, 8)} ${text}\n`) }, 0);
  }
  close() {}
}
