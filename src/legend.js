// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { styleText } from 'node:util';

export class Legend {
  constructor(freeze, version) {
    this.freeze = freeze;
    this.version = version;
  }
  text() {
    return `${this.#keys()}\tjinka ${styleText('bgGray', this.version, { validateStream: false })}`;
  }
  #keys() {
    return this.freeze.active()
      ? `keys: ${styleText('bgGray', 'C', { validateStream: false })} - to continue`
      : `keys: ${styleText('bgGray', 'F', { validateStream: false })} - to finish and quit, ${styleText('bgGray', '+/-', { validateStream: false })} to add threads`;
  }
}
