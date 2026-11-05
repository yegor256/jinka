// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const ellipsized = (origin, limit) => Object.freeze({
  text: () => (
    origin.length < limit
      ? origin
      : `${origin.slice(0, Math.floor((limit - 2) / 2))}…${origin.slice(-Math.ceil((limit - 2) / 2))}`
  )
});
