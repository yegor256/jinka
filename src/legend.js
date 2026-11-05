// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { styleText } from 'node:util';

export const legend = (freeze, release) => {
  const keys = () => (
    freeze.active()
      ? `keys: ${styleText('bgGray', 'C', { validateStream: false })} - to continue`
      : `keys: ${styleText('bgGray', 'F', { validateStream: false })} - to finish and quit, ${styleText('bgGray', '+/-', { validateStream: false })} to add threads`
  );
  return Object.freeze({
    text: () => `${keys()}\t${release.text()}`
  });
};
