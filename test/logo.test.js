// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { stripVTControlCharacters } from 'node:util';
import { assertThat, equalTo, everyItem, startsWith } from 'hamjest';
import { Logo } from '../src/logo.js';

describe('Logo', () => {
  it('draws a pike in two lines', () => {
    assertThat('pike is not drawn', new Logo().lines().map((l) => stripVTControlCharacters(l)), equalTo(['▚▄▄▙▄▄▄▄▗▄▖ ', '▞▀▀▛▀▀▀▛▀▀▀▀']));
  });
  it('paints the pike in terracotta', () => {
    assertThat('pike is not painted terracotta', new Logo().lines(), everyItem(startsWith('\x1b[38;2;215;119;87m')));
  });
});
