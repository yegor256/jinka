// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const limited = (origin, limit, freeze) => {
  const state = { given: 0 };
  return Object.freeze({
    next: async (signal) => {
      const wish = await origin.next(signal);
      state.given += 1;
      if (state.given >= limit) {
        freeze.on();
      }
      return wish;
    }
  });
};
