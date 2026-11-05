// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, matchesPattern } from 'hamjest';
import { log } from '../src/log.js';

describe('log', () => {
  it('prints nothing about a thread', () => {
    const chunks = [];
    log({ write: (c) => chunks.push(c) }).row(2).show(`a.md\t${randomUUID()}`);
    assertThat('thread row was printed', chunks, equalTo([]));
  });
  it('writes nothing on close', () => {
    const chunks = [];
    log({ write: (c) => chunks.push(c) }).close();
    assertThat('log wrote something on close', chunks, equalTo([]));
  });
  it('writes nothing on scroll', () => {
    const chunks = [];
    const l = log({ write: (c) => chunks.push(c) });
    l.up();
    l.down();
    assertThat('log wrote something on scroll', chunks, equalTo([]));
  });
  it('prints a notice with the time of day', () => {
    const chunks = [];
    const text = randomUUID();
    log({ write: (c) => chunks.push(c) }).notice().info(text);
    assertThat('notice was not printed', chunks.join(''), matchesPattern(new RegExp(`^\\d{2}:\\d{2}:\\d{2} ${text}\\n$`)));
  });
  it('prints a warning without colors', () => {
    const chunks = [];
    const text = randomUUID();
    log({ write: (c) => chunks.push(c) }).notice().warn(text);
    assertThat('warning was not printed plainly', chunks.join(''), matchesPattern(new RegExp(`^\\d{2}:\\d{2}:\\d{2} ${text}\\n$`)));
  });
});
