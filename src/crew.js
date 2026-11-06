// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const crew = (size, limit, notice) => {
  const seats = new Map(Array.from({ length: size }, (_, i) => [i, { wish: '', controller: new AbortController() }]));
  const state = { launch: () => {}, runs: [] };
  const indexes = () => [...seats.keys()].sort((a, b) => a - b);
  const join = async (from) => {
    const to = state.runs.length;
    if (from < to) {
      await Promise.all(state.runs.slice(from, to));
      await join(to);
    }
  };
  return Object.freeze({
    size: () => seats.size,
    indexes,
    more: () => {
      if (seats.size >= limit) {
        notice.warn(`more than ${limit} threads are not allowed`);
        return;
      }
      const index = Array.from({ length: limit }, (_, i) => i).find((i) => !seats.has(i));
      seats.set(index, { wish: '', controller: new AbortController() });
      state.launch(index);
    },
    less: () => {
      const index = indexes().findLast((i) => seats.get(i).wish === '');
      if (seats.size === 1) {
        notice.warn('the last thread cannot be removed');
      } else if (index === undefined) {
        notice.warn(`cannot remove a thread, because all ${seats.size} threads are working on wishes (${indexes().map((i) => seats.get(i).wish).join(', ')}), and a thread can be removed only when it holds no wish`);
      } else {
        seats.get(index).controller.abort();
        seats.delete(index);
      }
    },
    run: async (wishes, wand, signal) => {
      state.launch = (index) => {
        const seat = seats.get(index);
        state.runs.push(
          wand(
            index,
            {
              next: async (s) => {
                const wish = await wishes.next(s);
                seat.wish = wish.name();
                return Object.freeze({
                  ...wish,
                  close: async () => {
                    await wish.close();
                    seat.wish = '';
                  },
                  free: () => {
                    wish.free();
                    seat.wish = '';
                  }
                });
              }
            },
            AbortSignal.any([signal, seat.controller.signal])
          )
        );
      };
      indexes().forEach((i) => state.launch(i));
      await join(0);
    }
  });
};
