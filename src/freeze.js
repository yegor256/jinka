// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const freeze = (crew, notice, quit) => {
  const state = { frozen: false, idle: 0 };
  const waiters = [];
  const check = () => {
    if (state.frozen && state.idle === crew.size()) {
      quit();
    }
  };
  return Object.freeze({
    on: () => {
      state.frozen = true;
      notice.warn('finishing, now we wait for all jobs to finish and then quit');
      check();
    },
    off: () => {
      state.frozen = false;
      notice.warn('continuing, new jobs will start again');
      waiters.splice(0).forEach((w) => w());
    },
    active: () => state.frozen,
    enter: () => {
      state.idle += 1;
      check();
    },
    leave: () => {
      state.idle -= 1;
    },
    thaw: async (signal) => {
      signal.throwIfAborted();
      if (state.frozen) {
        await new Promise((resolve, reject) => {
          waiters.push(resolve);
          signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        });
      }
    }
  });
};
