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
  it('prints a change without colors', () => {
    const chunks = [];
    const text = randomUUID();
    new Log({ write: (c) => chunks.push(c) }).row(1).show(`c.md\t\x1b[90m${text}\x1b[39m`);
    assertThat('colors were printed', chunks.join(''), equalTo(`[2] c.md  ${text}\n`));
  });
  it('writes nothing on close', () => {
    const chunks = [];
    new Log({ write: (c) => chunks.push(c) }).close();
    assertThat('log wrote something on close', chunks, equalTo([]));
  });
  it('prints a notice with the time of day', () => {
    const chunks = [];
    const text = randomUUID();
    new Log({ write: (c) => chunks.push(c) }).notice().info(text);
    assertThat('notice was not printed', chunks.join(''), matchesPattern(new RegExp(`^\\d{2}:\\d{2}:\\d{2} ${text}\\n$`)));
  });
  it('prints a warning without colors', () => {
    const chunks = [];
    const text = randomUUID();
    new Log({ write: (c) => chunks.push(c) }).notice().warn(text);
    assertThat('warning was not printed plainly', chunks.join(''), matchesPattern(new RegExp(`^\\d{2}:\\d{2}:\\d{2} ${text}\\n$`)));
  });
});
