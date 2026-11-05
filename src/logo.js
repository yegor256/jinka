// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const logo = () => Object.freeze({
  lines: () => ['▚▄▄▙▄▄▄▄▗▄▖ ', '▞▀▀▛▀▀▀▛▀▀▀▀'].map((l) => `\x1b[38;2;215;119;87m${l}\x1b[39m`)
});
