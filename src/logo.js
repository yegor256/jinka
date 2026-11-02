// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Logo {
  lines() {
    return ['▚▄▄▙▄▄▄▄▗▄▖ ', '▞▀▀▛▀▀▀▛▀▀▀▀'].map((l) => `\x1b[38;2;215;119;87m${l}\x1b[39m`);
  }
}
