// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { styleText } from 'node:util';
import { duration } from './duration.js';

export const status = (start, jobs, agent, model, tokens, quota) => Object.freeze({
  text: () => {
    const now = Date.now();
    return [
      `up:${styleText('bgGray', duration(now - start).hours(), { validateStream: false })}`,
      `done:${styleText('bgGray', jobs.text(), { validateStream: false })}`,
      `agent:${styleText('bgGray', agent, { validateStream: false })}`,
      `model:${styleText('bgGray', model === '' ? 'default' : model, { validateStream: false })}`,
      `tokens:${styleText('bgGray', tokens.text(), { validateStream: false })}`,
      `quota:${styleText('bgGray', quota.text(now), { validateStream: false })}`
    ].join(' ');
  }
});
