// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { stripVTControlCharacters } from 'node:util';
import { row } from './row.js';
import { protocol } from './protocol.js';

export const log = (stream) => Object.freeze({
  row: (index) => row({ push: ([i, text]) => stream.write(`[${i + 1}] ${stripVTControlCharacters(text).replace('\t', '  ')}\n`) }, index),
  notice: () => protocol({ push: ([, text]) => stream.write(`${new Date().toTimeString().slice(0, 8)} ${text}\n`) }),
  up: () => {},
  down: () => {},
  close: () => {}
});
