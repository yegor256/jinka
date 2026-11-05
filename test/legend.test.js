// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { stripVTControlCharacters } from 'node:util';
import { assertThat, equalTo, endsWith } from 'hamjest';
import { crew } from '../src/crew.js';
import { protocol } from '../src/protocol.js';
import { legend } from '../src/legend.js';
import { freeze } from '../src/freeze.js';

describe('legend', () => {
  it('tells how to finish and quit', () => {
    assertThat('finish key is not shown', stripVTControlCharacters(legend(freeze(crew(2, 16, protocol([])), protocol([]), () => {}), { text: () => '1.4.2' }).text()).split('\t')[0], equalTo('keys: F - to finish and quit, +/- to add threads'));
  });
  it('tells how to continue while frozen', () => {
    const f = freeze(crew(2, 16, protocol([])), protocol([]), () => {});
    f.on();
    assertThat('continue key is not shown', stripVTControlCharacters(legend(f, { text: () => '0.9.3' }).text()).split('\t')[0], equalTo('keys: C - to continue'));
  });
  it('paints the keys on a dark gray background', () => {
    assertThat('keys are not painted gray', legend(freeze(crew(3, 16, protocol([])), protocol([]), () => {}), { text: () => '2.0.7' }).text().split('\t')[0], equalTo('keys: \x1b[100mF\x1b[49m - to finish and quit, \x1b[100m+/-\x1b[49m to add threads'));
  });
  it('paints the continue key on a dark gray background', () => {
    const f = freeze(crew(4, 16, protocol([])), protocol([]), () => {});
    f.on();
    assertThat('continue key is not painted dark gray', legend(f, { text: () => '3.1.5' }).text().split('\t')[0], equalTo('keys: \x1b[100mC\x1b[49m - to continue'));
  });
  it('shows the release after a tab', () => {
    const version = randomUUID();
    assertThat('release is not shown after a tab', legend(freeze(crew(2, 16, protocol([])), protocol([]), () => {}), { text: () => version }).text(), endsWith(`s\t${version}`));
  });
});
