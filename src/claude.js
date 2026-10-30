// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { join, dirname, extname } from 'node:path';
import { Event } from './event.js';

/**
 * The coding agent that makes one wish come true.
 * It starts the agent with the plugin and the directory of wishes,
 * writes the prompt to its standard input, and reports every event
 * of its stream-json output to a screen row and to the counter of
 * tokens. The raw output and
 * error output of every run are saved into the logs directory,
 * in a file named after the wish and the start time.
 */
export class Claude {
  constructor(agent, plugin, dir, logs, tokens) {
    this.agent = agent;
    this.plugin = plugin;
    this.dir = dir;
    this.logs = logs;
    this.tokens = tokens;
  }
  async run(wish, row, signal) {
    const prompt = [
      'Make this wish come true, working on your own without asking any questions:',
      '',
      await wish.text(),
      '',
      `The wish is written in the file ${join(this.dir, wish.name())}, ${wish.fate()}.`,
      `All wishes live in the directory ${this.dir}, and you may add new wishes there as Markdown files.`
    ].join('\n');
    const file = join(
      this.logs,
      `${wish.name().slice(0, wish.name().length - extname(wish.name()).length)}-${new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)}.jsonl`
    );
    await mkdir(dirname(file), { recursive: true });
    const log = createWriteStream(file);
    const child = this.agent.start(['--plugin-dir', this.plugin, '--add-dir', this.dir], signal);
    child.stdin.on('error', () => {});
    child.stdin.end(prompt);
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    createInterface({ input: child.stdout }).on('line', (line) => {
      this.tokens.add(line);
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
      child.on('close', (code) => log.end(() => resolve(code ?? 1)));
    });
  }
}
