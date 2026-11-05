// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const jobs = (agent) => {
  const count = { done: 0 };
  return Object.freeze({
    run: async (wish, row, signal) => {
      const result = await agent.run(wish, row, signal);
      if (result.code === 0) {
        count.done += 1;
      }
      return result;
    },
    text: () => `${count.done}`
  });
};
