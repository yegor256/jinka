// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { stripVTControlCharacters } from 'node:util';
import { assertThat, equalTo } from 'hamjest';
import { Crew } from '../src/crew.js';
import { Protocol } from '../src/protocol.js';
import { Legend } from '../src/legend.js';
import { Freeze } from '../src/freeze.js';

describe('Legend', () => {
  it('tells how to finish and quit', () => {
    assertThat('finish key is not shown', stripVTControlCharacters(new Legend(new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {})).text()), equalTo('keys: F - to finish and quit, +/- to add threads'));
  });
  it('tells how to continue while frozen', () => {
    const freeze = new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {});
    freeze.on();
    assertThat('continue key is not shown', stripVTControlCharacters(new Legend(freeze).text()), equalTo('keys: C - to continue'));
  });
  it('paints the keys on a dark gray background', () => {
    assertThat('keys are not painted gray', new Legend(new Freeze(new Crew(3, 16, new Protocol([])), new Protocol([]), () => {})).text(), equalTo('keys: \x1b[100mF\x1b[49m - to finish and quit, \x1b[100m+/-\x1b[49m to add threads'));
  });
  it('paints the continue key on a dark gray background', () => {
    const freeze = new Freeze(new Crew(4, 16, new Protocol([])), new Protocol([]), () => {});
    freeze.on();
    assertThat('continue key is not painted dark gray', new Legend(freeze).text(), equalTo('keys: \x1b[100mC\x1b[49m - to continue'));
  });
});
