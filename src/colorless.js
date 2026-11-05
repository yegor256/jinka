// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Colorless {
  constructor(stream) {
    this.stream = stream;
  }
  get columns() {
    return this.stream.columns;
  }
  get rows() {
    return this.stream.rows;
  }
  on(event, listener) {
    return this.stream.on(event, listener);
  }
  write(text, done) {
    return this.stream.write(text.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g'), ''), done);
  }
}
