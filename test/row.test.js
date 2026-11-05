// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, hasItem, equalTo } from 'hamjest';
import { row } from '../src/row.js';

describe('row', () => {
  it('sends its index and text to the screen', () => {
    const lines = [];
    const text = randomUUID();
    row(lines, 7).show(text);
    assertThat('row did not reach the screen', lines, hasItem(equalTo([7, text])));
  });
});
