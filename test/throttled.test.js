// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, promiseThat, rejected } from 'hamjest';
import { Protocol } from '../src/protocol.js';
import { Throttled } from '../src/throttled.js';

describe('Throttled', () => {
  it('gives a wish while enough quota is left', async () => {
    const name = `${randomUUID()}.md`;
    assertThat(
      'wish was not given',
      (await new Throttled({ next: async () => ({ name: () => name }) }, { left: () => 43 }, 42, 10, new Protocol([])).next(AbortSignal.timeout(1000))).name(),
      equalTo(name)
    );
  });
  it('holds back a wish while too little quota is left', async () => {
    await promiseThat(
      'wish was given with too little quota',
      new Throttled({ next: async () => ({ name: () => 'a.md' }) }, { left: () => 14 }, 15, 10, new Protocol([])).next(AbortSignal.timeout(50)),
      rejected()
    );
  });
  it('gives a wish once the quota is back', async () => {
    const shares = [3, 7, 61];
    const name = `${randomUUID()}.md`;
    assertThat(
      'wish was not given after the quota came back',
      (await new Throttled({ next: async () => ({ name: () => name }) }, { left: () => shares.shift() ?? 61 }, 60, 10, new Protocol([])).next(AbortSignal.timeout(1000))).name(),
      equalTo(name)
    );
  });
  it('warns once while waiting for the quota', async () => {
    const shares = [5, 6, 8, 90];
    const lines = [];
    await new Throttled({ next: async () => ({ name: () => 'b.md' }) }, { left: () => shares.shift() ?? 90 }, 33, 10, new Protocol(lines)).next(AbortSignal.timeout(1000));
    assertThat('warning was not printed once', lines.length, equalTo(1));
  });
});
