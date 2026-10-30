// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, matchesPattern } from 'hamjest';
import { Log } from '../src/log.js';

describe('Log', () => {
  it('prints every change as a plain line', () => {
    const chunks = [];
    const text = randomUUID();
    new Log({ write: (c) => chunks.push(c) }).row(2).show(`a.md\t${text}`);
    assertThat('change was not printed', chunks.join(''), equalTo(`[3] a.md  ${text}\n`));
  });
  it('prints a protocol line with the time of day', () => {
    const chunks = [];
    const text = randomUUID();
    new Log({ write: (c) => chunks.push(c) }).protocol(4).show(`b.md\t${text}`);
    assertThat('protocol line was not printed', chunks.join(''), matchesPattern(new RegExp(`^\\d{2}:\\d{2}:\\d{2} \\[5\\] b\\.md  ${text}\\n$`)));
  });
  it('writes nothing on close', () => {
    const chunks = [];
    new Log({ write: (c) => chunks.push(c) }).close();
    assertThat('log wrote something on close', chunks, equalTo([]));
  });
});
