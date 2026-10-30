// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

/**
 * The running total of tokens spent by all agents, shared by all of them.
 * It reads every line of the stream-json output of the agents and sums
 * the input, output, and cache tokens of each message the model sends.
 * The agent repeats the usage of one message in every event that carries
 * a part of it, so each message is counted only once, by its identifier.
 * The total is printed in a short form, such as 1.2M.
 */
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
