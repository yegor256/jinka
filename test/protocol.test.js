// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, hasItem, equalTo } from 'hamjest';
import { Protocol } from '../src/protocol.js';

describe('Protocol', () => {
  it('sends an informational message to the screen', () => {
    const lines = [];
    const text = randomUUID();
    new Protocol(lines).info(text);
    assertThat('information did not reach the screen', lines, hasItem(equalTo(['info', text])));
  });
  it('sends a warning to the screen', () => {
    const lines = [];
    const text = randomUUID();
    new Protocol(lines).warn(text);
    assertThat('warning did not reach the screen', lines, hasItem(equalTo(['warn', text])));
  });
});
