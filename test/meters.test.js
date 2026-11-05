// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo } from 'hamjest';
import { meters } from '../src/meters.js';

describe('meters', () => {
  it('gives every line to every meter', () => {
    const seen = [];
    const line = randomUUID();
    meters([{ add: (l) => seen.push(`a${l}`) }, { add: (l) => seen.push(`b${l}`) }]).add(line);
    assertThat('line was not given to every meter', seen, equalTo([`a${line}`, `b${line}`]));
  });
});
