// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const wheel = (stream, screen) => Object.freeze({
  listen: () => {
    stream.on('data', (chunk) =>
      chunk
        .toString()
        .split('\x1b')
        .slice(1)
        .map((s) => s.slice(0, 2))
        .filter((s) => /^[[O][AB]$/.test(s))
        .forEach((s) => (s.endsWith('A') ? screen.up() : screen.down()))
    );
  }
});
