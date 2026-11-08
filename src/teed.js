// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { protocol } from './protocol.js';

export const teed = (screen, copy) => Object.freeze({
  row: (index) => screen.row(index),
  notice: () => protocol({
    push: ([level, text]) => {
      screen.notice()[level](text);
      copy.notice()[level](text);
    }
  }),
  up: () => screen.up(),
  down: () => screen.down(),
  close: () => {
    screen.close();
    copy.close();
  }
});
