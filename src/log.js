// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { protocol } from './protocol.js';

export const log = (stream) => Object.freeze({
  row: () => Object.freeze({ show: () => {} }),
  notice: () => protocol({ push: ([, text]) => stream.write(`${new Date().toTimeString().slice(0, 8)} ${text}\n`) }),
  up: () => {},
  down: () => {},
  close: () => {}
});
