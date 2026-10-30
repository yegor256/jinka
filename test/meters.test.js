// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo } from 'hamjest';
import { Meters } from '../src/meters.js';

describe('Meters', () => {
  it('gives every line to every meter', () => {
    const seen = [];
    const line = randomUUID();
    new Meters([{ add: (l) => seen.push(`a${l}`) }, { add: (l) => seen.push(`b${l}`) }]).add(line);
    assertThat('line was not given to every meter', seen, equalTo([`a${line}`, `b${line}`]));
  });
});
