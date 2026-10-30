// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { createInterface } from 'node:readline';
import { Event } from './event.js';
import { Tokens } from './tokens.js';
import { Model } from './model.js';

export class Claude {
  constructor(agent, plugin, disk, tokens) {
    this.agent = agent;
    this.plugin = plugin;
    this.disk = disk;
    this.tokens = tokens;
  }
  async run(wish, row, signal) {
    const prompt = [
      'Make this wish come true, working on your own without asking any questions:',
      '',
      await wish.text(),
      '',
      ...this.disk.lines(wish),
      'When you finish, end with a single plain sentence that says what you did.'
    ].join('\n');
    const log = await this.disk.log(wish);
    const child = this.agent.start(['--plugin-dir', this.plugin, ...this.disk.args()], signal);
    child.stdin.on('error', () => {});
    child.stdin.end(prompt);
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    let summary = '';
    const usage = new Tokens();
    const model = new Model();
    createInterface({ input: child.stdout }).on('line', (line) => {
      this.tokens.add(line);
      usage.add(line);
      model.add(line);
      summary = new Event(line).summary() || summary;
      const text = new Event(line).text();
      if (text !== '') {
        row.show(text);
      }
    });
    return new Promise((resolve, reject) => {
      child.on('error', (e) => {
        if (!signal.aborted) {
          reject(new Error(`Cannot start the agent "${child.spawnfile}": ${e.message}`));
        }
      });
      child.on('close', (code) => log.end(() => resolve({ code: code ?? 1, summary, tokens: usage.text(), model: model.text() })));
    });
  }
}
