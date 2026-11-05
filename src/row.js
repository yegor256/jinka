// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const row = (lines, index) => Object.freeze({
  show: (text) => lines.push([index, text])
});
