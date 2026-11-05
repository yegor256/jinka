// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const summarized = (screen, summary, stream) => {
  const done = [];
  return Object.freeze({
    row: (index) => screen.row(index),
    notice: () => screen.notice(),
    up: () => screen.up(),
    down: () => screen.down(),
    close: () => {
      screen.close();
      if (done.length === 0) {
        done.push(true);
        stream.write(summary.text());
      }
    }
  });
};
