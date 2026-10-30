// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { stripVTControlCharacters } from 'node:util';
import { Row } from './row.js';
import { Protocol } from './protocol.js';

export class Log {
  constructor(stream) {
    this.stream = stream;
  }
  row(index) {
    return new Row({ push: ([i, text]) => this.stream.write(`[${i + 1}] ${stripVTControlCharacters(text).replace('\t', '  ')}\n`) }, index);
  }
  notice() {
    return new Protocol({ push: ([, text]) => this.stream.write(`${new Date().toTimeString().slice(0, 8)} ${text}\n`) });
  }
  up() {}
  down() {}
  close() {}
}
