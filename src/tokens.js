// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { styleText } from 'node:util';

export const tokens = () => {
  const messages = new Map();
  return Object.freeze({
    add: (line) => {
      try {
        const json = JSON.parse(line);
        if (json.type === 'assistant' && json.message?.id !== undefined && json.message?.usage !== undefined) {
          messages.set(
            json.message.id,
            ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens']
              .reduce((sum, key) => sum + (json.message.usage[key] ?? 0), 0)
          );
        }
        if (json.type === 'turn.completed' && json.usage !== undefined) {
          messages.set(Symbol('turn'), (json.usage.input_tokens ?? 0) + (json.usage.output_tokens ?? 0));
        }
      } catch {
        return;
      }
    },
    text: () => {
      const sum = [...messages.values()].reduce((total, count) => total + count, 0);
      const text = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(sum);
      return sum > 1_000_000 ? styleText('red', text, { validateStream: false }) : text;
    }
  });
};
