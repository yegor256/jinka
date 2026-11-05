// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, hasSize, lessThan } from 'hamjest';
import { ellipsized } from '../src/ellipsized.js';

describe('ellipsized', () => {
  it('keeps a short text as is', () => {
    const text = randomUUID();
    assertThat('short text was changed', ellipsized(text, 64).text(), equalTo(text));
  });
  it('makes a long text shorter than the limit', () => {
    assertThat('long text was not shortened', ellipsized(`${randomUUID()}${randomUUID()}${randomUUID()}`, 64).text(), hasSize(lessThan(64)));
  });
  it('cuts a long text in the middle', () => {
    assertThat('long text was not cut in the middle', ellipsized(`${'a'.repeat(40)}${'b'.repeat(13)}${'c'.repeat(40)}`, 16).text(), equalTo('aaaaaaa…ccccccc'));
  });
});
