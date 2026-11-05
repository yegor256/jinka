// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const permanent = (origin, pause) => Object.freeze({
  name: () => origin.name(),
  text: async () => origin.text(),
  fate: () => 'which stays there after you exit, so you must not delete it',
  close: async () => {
    setTimeout(() => origin.free(), pause).unref();
  },
  free: () => origin.free()
});
