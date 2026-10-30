// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Tokens {
  constructor() {
    this.messages = new Map();
  }
  add(line) {
    try {
      const json = JSON.parse(line);
      if (json.type === 'assistant' && json.message?.id !== undefined && json.message?.usage !== undefined) {
        this.messages.set(
          json.message.id,
          ['input_tokens', 'output_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens']
            .reduce((sum, key) => sum + (json.message.usage[key] ?? 0), 0)
        );
      }
    } catch {
      return;
    }
  }
  text() {
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
      .format([...this.messages.values()].reduce((sum, count) => sum + count, 0));
  }
}
