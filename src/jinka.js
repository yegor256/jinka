// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { wand } from './wand.js';

export const jinka = (wishes, agent, screen, crew) => Object.freeze({
  run: async (signal) => {
    await crew.run(
      wishes,
      (i, w, s) => wand(w, agent, screen.row(i), screen.notice()).run(s),
      signal
    );
  }
});
