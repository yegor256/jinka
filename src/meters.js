// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const meters = (m) => Object.freeze({
  add: (line) => m.forEach((meter) => meter.add(line))
});
