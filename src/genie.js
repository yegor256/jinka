// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { createInterface } from 'node:readline';
import { event } from './event.js';
import { tokens } from './tokens.js';

export const genie = (engine, disk, meter, model) => Object.freeze({
  run: async (wish, row, signal) => {
    const prompt = [
      'Make this wish come true, working on your own without asking any questions:',
      '',
      await wish.text(),
      '',
      ...(await disk.lines(wish)),
      ...(await engine.lines()),
      'When you finish, answer with a JSON object of two fields:',
      '"summary" is a single plain sentence that says what you did,',
      'and "link" is the full URL of the GitHub issue or pull request you worked on, or an empty string if there was none.'
    ].join('\n');
    const log = await disk.log(wish);
    const child = engine.start(disk.args(), signal);
    child.stdin.on('error', () => {});
    child.stdin.end(prompt);
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    let summary = '';
    let link = '';
    const usage = tokens();
    const m = model();
    let count = 0;
    createInterface({ input: child.stderr }).on('line', () => {
      count += 1;
    });
    createInterface({ input: child.stdout }).on('line', (line) => {
      count += 1;
      meter.add(line);
      usage.add(line);
      m.add(line);
      summary = event(line, count).summary() || summary;
      link = event(line, count).link() || link;
      const text = event(line, count).text();
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
      child.on('close', (code) => log.end(() => resolve({ code: code ?? 1, summary, link, tokens: usage.text(), model: m.text() })));
    });
  }
});
