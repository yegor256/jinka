// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { assertThat, equalTo } from 'hamjest';
import { Legend } from '../src/legend.js';
import { Freeze } from '../src/freeze.js';

describe('Legend', () => {
  it('tells how to finish and quit', () => {
    assertThat('finish key is not shown', new Legend(new Freeze(2, () => {})).text(), equalTo('F - to finish and quit'));
  });
  it('tells how to continue while frozen', () => {
    const freeze = new Freeze(2, () => {});
    freeze.on();
    assertThat('continue key is not shown', new Legend(freeze).text(), equalTo('C - to continue'));
  });
});
