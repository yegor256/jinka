// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { assertThat, equalTo } from 'hamjest';
import { duration } from '../src/duration.js';

describe('duration', () => {
  it('prints minutes and seconds', () => {
    assertThat('minutes were not printed', duration(291_700).minutes(), equalTo('04:51'));
  });
  it('prints more than sixty minutes without hours', () => {
    assertThat('minutes were wrapped into hours', duration(4_523_000).minutes(), equalTo('75:23'));
  });
  it('pads a short clock with spaces on the left to six symbols', () => {
    assertThat('clock was not padded', duration(291_700).clock(), equalTo(' 04:51'));
  });
  it('prints a clock of more than a hundred minutes in minutes and seconds', () => {
    assertThat('clock was not printed in minutes', duration(8_010_400).clock(), equalTo('133:30'));
  });
  it('prints a clock of more than nine hundred ninety nine minutes in hours and minutes', () => {
    assertThat('clock was not printed in hours', duration(73_212_400).clock(), equalTo('20:20m'));
  });
  it('prints a clock of more than ninety nine hours in hours only', () => {
    assertThat('clock was not printed in hours only', duration(452_113_700).clock(), equalTo('  125h'));
  });
  it('prints hours, minutes and seconds', () => {
    assertThat('hours were not printed', duration(6_127_400).hours(), equalTo('01:42:07'));
  });
  it('prints whole minutes in words', () => {
    assertThat('minutes were not printed in words', duration(900_000).phrase(), equalTo('15 minutes'));
  });
  it('prints one minute in singular', () => {
    assertThat('one minute was printed in plural', duration(61_300).phrase(), equalTo('1 minute'));
  });
  it('prints less than a minute in seconds', () => {
    assertThat('seconds were not printed in words', duration(37_900).phrase(), equalTo('37 seconds'));
  });
});
