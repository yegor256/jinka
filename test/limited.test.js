// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo } from 'hamjest';
import { Limited } from '../src/limited.js';

describe('Limited', () => {
  it('gives the wish it got from the origin', async () => {
    const name = `${randomUUID()}.md`;
    assertThat(
      'wish was not given',
      (await new Limited({ next: async () => ({ name: () => name }) }, 7, { on: () => {} }).next(AbortSignal.timeout(1000))).name(),
      equalTo(name)
    );
  });
  it('freezes once the limit of wishes is given', async () => {
    const freezes = [];
    const limited = new Limited({ next: async () => ({ name: () => 'a.md' }) }, 3, { on: () => freezes.push(true) });
    await limited.next(AbortSignal.timeout(1000));
    await limited.next(AbortSignal.timeout(1000));
    await limited.next(AbortSignal.timeout(1000));
    assertThat('jinka did not freeze at the limit', freezes, equalTo([true]));
  });
  it('does not freeze before the limit of wishes is given', async () => {
    const freezes = [];
    const limited = new Limited({ next: async () => ({ name: () => 'b.md' }) }, 4, { on: () => freezes.push(true) });
    await limited.next(AbortSignal.timeout(1000));
    await limited.next(AbortSignal.timeout(1000));
    assertThat('jinka froze before the limit', freezes, equalTo([]));
  });
});
