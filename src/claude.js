// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { join } from 'node:path';
import { Event } from './event.js';

/**
 * The coding agent that makes one wish come true.
 * It starts the agent process in headless mode, writes the prompt
 * to its standard input, and reports every event of its stream-json
 * output to a screen row. The model, when not empty, is passed
 * to the agent verbatim. The process gets SIGTERM when the signal
 * aborts.
 */
export class Claude {
  constructor(command, plugin, dir, model) {
    this.command = command;
    this.plugin = plugin;
    this.dir = dir;
    this.model = model;
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
    const agent = spawn(
      this.command,
      [
        '-p', '--output-format', 'stream-json', '--verbose',
        '--plugin-dir', this.plugin, '--add-dir', this.dir,
        '--dangerously-skip-permissions',
        ...(this.model === '' ? [] : ['--model', this.model])
      ],
      { signal, stdio: ['pipe', 'pipe', 'ignore'] }
    );
    agent.stdin.on('error', () => {});
    agent.stdin.end(prompt);
    createInterface({ input: agent.stdout }).on('line', (line) => {
      const text = new Event(line).text();
      if (text !== '') {
        row.show(text);
      }
    });
    return new Promise((resolve, reject) => {
      agent.on('error', (e) => {
        if (!signal.aborted) {
          reject(new Error(`Cannot start the agent "${this.command}": ${e.message}`));
        }
      });
      agent.on('close', (code) => resolve(code ?? 1));
    });
  }
}
