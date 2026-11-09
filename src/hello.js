// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { createInterface } from 'node:readline';
import { event } from './event.js';

export const hello = (engine, notice) => Object.freeze({
  run: (signal) => new Promise((resolve, reject) => {
    const child = engine.start([], signal, process.cwd());
    const answer = [''];
    child.stdin.on('error', () => {});
    child.stdin.end('Tell me, who you are, in a very short single sentence.');
    child.stderr.resume();
    createInterface({ input: child.stdout }).on('line', (line) => {
      answer[0] = event(line, 0).summary() || answer[0];
    });
    child.on('error', (e) => (signal.aborted ? resolve() : reject(new Error(`Cannot start the agent "${child.spawnfile}": ${e.message}`))));
    child.on('close', (code) => {
      if (signal.aborted) {
        resolve();
      } else if (code === 0) {
        notice.info(`the agent says: ${answer[0]}`);
        resolve();
      } else {
        reject(new Error(`The agent "${child.spawnfile}" exited with code ${code} while telling who it is: ${answer[0]}`));
      }
    });
  })
});
