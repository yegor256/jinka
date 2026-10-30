// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo, promiseThat, rejected } from 'hamjest';
import { Crew } from '../src/crew.js';
import { Protocol } from '../src/protocol.js';
import { Frozen } from '../src/frozen.js';
import { Freeze } from '../src/freeze.js';

describe('Frozen', () => {
  it('gives a wish while not frozen', async () => {
    const name = `${randomUUID()}.md`;
    assertThat(
      'wish was not given',
      (await new Frozen({ next: async () => ({ name: () => name }) }, new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {})).next(AbortSignal.timeout(1000))).name(),
      equalTo(name)
    );
  });
  it('holds back a wish while frozen', async () => {
    const freeze = new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {});
    freeze.on();
    await promiseThat(
      'wish was given while frozen',
      new Frozen({ next: async () => ({ name: () => 'a.md' }) }, freeze).next(AbortSignal.timeout(50)),
      rejected()
    );
  });
  it('gives a wish after the freeze is off', async () => {
    const freeze = new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {});
    const name = `${randomUUID()}.md`;
    freeze.on();
    setTimeout(() => freeze.off(), 20);
    assertThat(
      'wish was not given after thaw',
      (await new Frozen({ next: async () => ({ name: () => name }) }, freeze).next(AbortSignal.timeout(1000))).name(),
      equalTo(name)
    );
  });
  it('frees a wish that came while the freeze turned on', async () => {
    const freeze = new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {});
    const freed = [];
    await new Frozen(
      {
        next: async () => {
          if (freed.length === 0) {
            freeze.on();
            setTimeout(() => freeze.off(), 20);
          }
          return { name: () => 'b.md', free: () => freed.push(true) };
        }
      },
      freeze
    ).next(AbortSignal.timeout(1000));
    assertThat('wish was not freed', freed, equalTo([true]));
  });
  it('quits when the only wand asks for a wish while frozen', async () => {
    const quits = [];
    const freeze = new Freeze(new Crew(1, 16, new Protocol([])), new Protocol([]), () => quits.push(true));
    freeze.on();
    await new Frozen({ next: async () => ({ name: () => 'c.md' }) }, freeze).next(AbortSignal.timeout(50)).catch(() => {});
    assertThat('jinka did not quit', quits, equalTo([true]));
  });
  it('counts a wand as busy once it got a wish', async () => {
    const quits = [];
    const freeze = new Freeze(new Crew(1, 16, new Protocol([])), new Protocol([]), () => quits.push(true));
    await new Frozen({ next: async () => ({ name: () => 'd.md' }) }, freeze).next(AbortSignal.timeout(1000));
    freeze.on();
    assertThat('jinka quit with a busy wand', quits, equalTo([]));
  });
});
