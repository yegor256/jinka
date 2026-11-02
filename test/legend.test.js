// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { stripVTControlCharacters } from 'node:util';
import { assertThat, equalTo, endsWith } from 'hamjest';
import { Crew } from '../src/crew.js';
import { Protocol } from '../src/protocol.js';
import { Legend } from '../src/legend.js';
import { Freeze } from '../src/freeze.js';

describe('Legend', () => {
  it('tells how to finish and quit', () => {
    assertThat('finish key is not shown', stripVTControlCharacters(new Legend(new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {}), '1.4.2').text()).split('\t')[0], equalTo('keys: F - to finish and quit, +/- to add threads'));
  });
  it('tells how to continue while frozen', () => {
    const freeze = new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {});
    freeze.on();
    assertThat('continue key is not shown', stripVTControlCharacters(new Legend(freeze, '0.9.3').text()).split('\t')[0], equalTo('keys: C - to continue'));
  });
  it('paints the keys on a dark gray background', () => {
    assertThat('keys are not painted gray', new Legend(new Freeze(new Crew(3, 16, new Protocol([])), new Protocol([]), () => {}), '2.0.7').text().split('\t')[0], equalTo('keys: \x1b[100mF\x1b[49m - to finish and quit, \x1b[100m+/-\x1b[49m to add threads'));
  });
  it('paints the continue key on a dark gray background', () => {
    const freeze = new Freeze(new Crew(4, 16, new Protocol([])), new Protocol([]), () => {});
    freeze.on();
    assertThat('continue key is not painted dark gray', new Legend(freeze, '3.1.5').text().split('\t')[0], equalTo('keys: \x1b[100mC\x1b[49m - to continue'));
  });
  it('shows the version after a tab', () => {
    const version = randomUUID();
    assertThat('version is not shown after a tab', stripVTControlCharacters(new Legend(new Freeze(new Crew(2, 16, new Protocol([])), new Protocol([]), () => {}), version).text()), endsWith(`\tjinka ${version}`));
  });
  it('paints the version on a dark gray background', () => {
    const version = randomUUID();
    assertThat('version is not painted dark gray', new Legend(new Freeze(new Crew(5, 16, new Protocol([])), new Protocol([]), () => {}), version).text(), endsWith(`\tjinka \x1b[100m${version}\x1b[49m`));
  });
});
