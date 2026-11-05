// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const frozen = (origin, freeze) => {
  const wish = async (signal) => {
    await freeze.thaw(signal);
    const found = await origin.next(signal);
    if (freeze.active()) {
      found.free();
      return wish(signal);
    }
    return found;
  };
  return Object.freeze({
    next: async (signal) => {
      freeze.enter();
      try {
        return await wish(signal);
      } finally {
        freeze.leave();
      }
    }
  });
};
