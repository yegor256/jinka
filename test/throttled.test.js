// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, containsString, equalTo, promiseThat, rejected } from 'hamjest';
import { Protocol } from '../src/protocol.js';
import { Throttled } from '../src/throttled.js';

describe('Throttled', () => {
  it('gives a wish while enough quota is left', async () => {
    const name = `${randomUUID()}.md`;
    assertThat(
      'wish was not given',
      (await new Throttled({ next: async () => ({ name: () => name }) }, { left: () => 43, name: () => 'five-hour' }, 42, 10, new Protocol([])).next(AbortSignal.timeout(1000))).name(),
      equalTo(name)
    );
  });
  it('holds back a wish while too little quota is left', async () => {
    await promiseThat(
      'wish was given with too little quota',
      new Throttled({ next: async () => ({ name: () => 'a.md' }) }, { left: () => 14, name: () => 'five-hour' }, 15, 10, new Protocol([])).next(AbortSignal.timeout(50)),
      rejected()
    );
  });
  it('gives a wish once the quota is back', async () => {
    const shares = [3, 7, 61];
    const name = `${randomUUID()}.md`;
    assertThat(
      'wish was not given after the quota came back',
      (await new Throttled({ next: async () => ({ name: () => name }) }, { left: () => shares.shift() ?? 61, name: () => 'five-hour' }, 60, 10, new Protocol([])).next(AbortSignal.timeout(1000))).name(),
      equalTo(name)
    );
  });
  it('warns on every check of the quota', async () => {
    const shares = [5, 6, 8, 90];
    const lines = [];
    await new Throttled({ next: async () => ({ name: () => 'b.md' }) }, { left: () => shares.shift() ?? 90, name: () => 'five-hour' }, 33, 10, new Protocol(lines)).next(AbortSignal.timeout(1000));
    assertThat('warning was not printed on every check', lines.length, equalTo(4));
  });
  it('warns that the quota is still over on a recheck', async () => {
    const shares = [4, 7, 95];
    const lines = [];
    await new Throttled({ next: async () => ({ name: () => 'c.md' }) }, { left: () => shares.shift() ?? 95, name: () => 'five-hour' }, 21, 10, new Protocol(lines)).next(AbortSignal.timeout(1000));
    assertThat('recheck did not say the quota is still over', lines[1][1], containsString('still only 7% of the five-hour quota'));
  });
  it('warns that jobs resume once the quota is back', async () => {
    const shares = [2, 88];
    const lines = [];
    await new Throttled({ next: async () => ({ name: () => 'd.md' }) }, { left: () => shares.shift() ?? 88, name: () => 'five-hour' }, 17, 10, new Protocol(lines)).next(AbortSignal.timeout(1000));
    assertThat('recheck did not say jobs resume', lines.at(-1)[1], containsString('new jobs resume'));
  });
  it('names the quota window that is low', async () => {
    const shares = [3, 99];
    const lines = [];
    await new Throttled({ next: async () => ({ name: () => 'e.md' }) }, { left: () => shares.shift() ?? 99, name: () => 'seven-day' }, 26, 10, new Protocol(lines)).next(AbortSignal.timeout(1000));
    assertThat('warning did not name the quota window', lines[0][1], containsString('of the seven-day quota'));
  });
  it('tells the time of the next check in words', async () => {
    const shares = [8, 97];
    const lines = [];
    await new Throttled({ next: async () => ({ name: () => 'f.md' }) }, { left: () => shares.shift() ?? 97, name: () => 'five-hour' }, 44, 10, new Protocol(lines)).next(AbortSignal.timeout(1000));
    assertThat('warning did not tell the next check in words', lines[0][1], containsString('next check in 0 seconds'));
  });
});
