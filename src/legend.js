// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { styleText } from 'node:util';

export class Legend {
  constructor(freeze, release) {
    this.freeze = freeze;
    this.release = release;
  }
  text() {
    return `${this.#keys()}\t${this.release.text()}`;
  }
  #keys() {
    return this.freeze.active()
      ? `keys: ${styleText('bgGray', 'C', { validateStream: false })} - to continue`
      : `keys: ${styleText('bgGray', 'F', { validateStream: false })} - to finish and quit, ${styleText('bgGray', '+/-', { validateStream: false })} to add threads`;
  }
}
