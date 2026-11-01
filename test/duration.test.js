// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { assertThat, equalTo } from 'hamjest';
import { Duration } from '../src/duration.js';

describe('Duration', () => {
  it('prints minutes and seconds', () => {
    assertThat('minutes were not printed', new Duration(291_700).minutes(), equalTo('04:51'));
  });
  it('prints more than sixty minutes without hours', () => {
    assertThat('minutes were wrapped into hours', new Duration(4_523_000).minutes(), equalTo('75:23'));
  });
  it('prints hours, minutes and seconds', () => {
    assertThat('hours were not printed', new Duration(6_127_400).hours(), equalTo('01:42:07'));
  });
  it('prints whole minutes in words', () => {
    assertThat('minutes were not printed in words', new Duration(900_000).phrase(), equalTo('15 minutes'));
  });
  it('prints one minute in singular', () => {
    assertThat('one minute was printed in plural', new Duration(61_300).phrase(), equalTo('1 minute'));
  });
  it('prints less than a minute in seconds', () => {
    assertThat('seconds were not printed in words', new Duration(37_900).phrase(), equalTo('37 seconds'));
  });
});
