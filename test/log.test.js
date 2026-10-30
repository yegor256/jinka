// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo } from 'hamjest';
import { Log } from '../src/log.js';

describe('Log', () => {
  it('prints every change as a plain line', () => {
    const chunks = [];
    const text = randomUUID();
    new Log({ write: (c) => chunks.push(c) }).row(2).show(`a.md\t${text}`);
    assertThat('change was not printed', chunks.join(''), equalTo(`[3] a.md  ${text}\n`));
  });
});
