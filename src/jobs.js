// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Jobs {
  constructor(agent) {
    this.agent = agent;
    this.count = { done: 0 };
  }
  async run(wish, row, signal) {
    const result = await this.agent.run(wish, row, signal);
    if (result.code === 0) {
      this.count.done += 1;
    }
    return result;
  }
  text() {
    return `${this.count.done}`;
  }
}
