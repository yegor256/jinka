// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { createInterface } from 'node:readline';
import { Event } from './event.js';
import { Tokens } from './tokens.js';
import { Model } from './model.js';

export class Genie {
  constructor(engine, disk, meter) {
    this.engine = engine;
    this.disk = disk;
    this.meter = meter;
  }
  async run(wish, row, signal) {
    const prompt = [
      'Make this wish come true, working on your own without asking any questions:',
      '',
      await wish.text(),
      '',
      ...this.disk.lines(wish),
      ...this.engine.lines(),
      'When you finish, end with a single plain sentence that says what you did.',
      'On the next line, write the full URL of the GitHub issue or pull request you worked on, if there was one.'
    ].join('\n');
    const log = await this.disk.log(wish);
    const child = this.engine.start(this.disk.args(), signal);
    child.stdin.on('error', () => {});
    child.stdin.end(prompt);
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    let summary = '';
    let link = '';
    const usage = new Tokens();
    const model = new Model();
    let count = 0;
    createInterface({ input: child.stderr }).on('line', () => {
      count += 1;
    });
    createInterface({ input: child.stdout }).on('line', (line) => {
      count += 1;
      this.meter.add(line);
      usage.add(line);
      model.add(line);
      summary = new Event(line, count).summary() || summary;
      link = new Event(line, count).link() || link;
      const text = new Event(line, count).text();
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
      child.on('close', (code) => log.end(() => resolve({ code: code ?? 1, summary, link, tokens: usage.text(), model: model.text() })));
    });
  }
}
