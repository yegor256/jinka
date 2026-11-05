// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const protocol = (lines) => Object.freeze({
  info: (text) => lines.push(['info', text]),
  warn: (text) => lines.push(['warn', text])
});
