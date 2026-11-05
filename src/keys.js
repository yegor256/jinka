// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const keys = (stream, freeze, crew, interrupt) => {
  const press = (key) => {
    ({
      f: () => freeze.on(),
      F: () => freeze.on(),
      c: () => freeze.off(),
      C: () => freeze.off(),
      '+': () => crew.more(),
      '-': () => crew.less(),
      '\x03': () => interrupt()
    })[key]?.();
  };
  return Object.freeze({
    listen: () => {
      if (stream.isTTY) {
        stream.setRawMode(true);
      }
      stream.on('data', (chunk) => [...chunk.toString()].forEach((k) => press(k)));
    }
  });
};
