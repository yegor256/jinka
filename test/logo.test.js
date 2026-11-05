// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { stripVTControlCharacters } from 'node:util';
import { assertThat, equalTo, everyItem, startsWith } from 'hamjest';
import { logo } from '../src/logo.js';

describe('logo', () => {
  it('draws a pike in two lines', () => {
    assertThat('pike is not drawn', logo().lines().map((l) => stripVTControlCharacters(l)), equalTo(['▚▄▄▙▄▄▄▄▗▄▖ ', '▞▀▀▛▀▀▀▛▀▀▀▀']));
  });
  it('paints the pike in terracotta', () => {
    assertThat('pike is not painted terracotta', logo().lines(), everyItem(startsWith('\x1b[38;2;215;119;87m')));
  });
});
