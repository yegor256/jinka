// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, promiseThat, rejected } from 'hamjest';
import { crew } from '../src/crew.js';
import { protocol } from '../src/protocol.js';
import { frozen } from '../src/frozen.js';
import { freeze } from '../src/freeze.js';

describe('frozen', () => {
  it('gives a wish while not frozen', async () => {
    const name = `${randomUUID()}.md`;
    assertThat(
      'wish was not given',
      (await frozen({ next: async () => ({ name: () => name }) }, freeze(crew(2, 16, protocol([])), protocol([]), () => {})).next(AbortSignal.timeout(1000))).name(),
      equalTo(name)
    );
  });
  it('holds back a wish while frozen', async () => {
    const f = freeze(crew(2, 16, protocol([])), protocol([]), () => {});
    f.on();
    await promiseThat(
      'wish was given while frozen',
      frozen({ next: async () => ({ name: () => 'a.md' }) }, f).next(AbortSignal.timeout(50)),
      rejected()
    );
  });
  it('gives a wish after the freeze is off', async () => {
    const f = freeze(crew(2, 16, protocol([])), protocol([]), () => {});
    const name = `${randomUUID()}.md`;
    f.on();
    setTimeout(() => f.off(), 20);
    assertThat(
      'wish was not given after thaw',
      (await frozen({ next: async () => ({ name: () => name }) }, f).next(AbortSignal.timeout(1000))).name(),
      equalTo(name)
    );
  });
  it('frees a wish that came while the freeze turned on', async () => {
    const f = freeze(crew(2, 16, protocol([])), protocol([]), () => {});
    const freed = [];
    await frozen(
      {
        next: async () => {
          if (freed.length === 0) {
            f.on();
            setTimeout(() => f.off(), 20);
          }
          return { name: () => 'b.md', free: () => freed.push(true) };
        }
      },
      f
    ).next(AbortSignal.timeout(1000));
    assertThat('wish was not freed', freed, equalTo([true]));
  });
  it('quits when the only wand asks for a wish while frozen', async () => {
    const quits = [];
    const f = freeze(crew(1, 16, protocol([])), protocol([]), () => quits.push(true));
    f.on();
    await frozen({ next: async () => ({ name: () => 'c.md' }) }, f).next(AbortSignal.timeout(50)).catch(() => {});
    assertThat('jinka did not quit', quits, equalTo([true]));
  });
  it('counts a wand as busy once it got a wish', async () => {
    const quits = [];
    const f = freeze(crew(1, 16, protocol([])), protocol([]), () => quits.push(true));
    await frozen({ next: async () => ({ name: () => 'd.md' }) }, f).next(AbortSignal.timeout(1000));
    f.on();
    assertThat('jinka quit with a busy wand', quits, equalTo([]));
  });
});
