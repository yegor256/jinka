// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { styleText } from 'node:util';

export class Legend {
  constructor(freeze) {
    this.freeze = freeze;
  }
  text() {
    return this.freeze.active()
      ? `${styleText('bgWhite', 'C', { validateStream: false })} - to continue`
      : `${styleText('bgWhite', 'F', { validateStream: false })} - to finish and quit, ${styleText('bgWhite', '+/-', { validateStream: false })} to add threads`;
  }
}
