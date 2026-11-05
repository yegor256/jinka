// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const colorless = (stream) => Object.freeze({
  get columns() {
    return stream.columns;
  },
  get rows() {
    return stream.rows;
  },
  on: (event, listener) => stream.on(event, listener),
  write: (text, done) => stream.write(text.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g'), ''), done)
});
