// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import spawn from 'cross-spawn';

export class Agent {
  constructor(command, model) {
    this.command = command;
    this.model = model;
  }
  start(args, signal) {
    const windows = process.platform === 'win32';
    const child = spawn(
      this.command,
      [
        '-p', '--output-format', 'stream-json', '--verbose',
        ...args,
        '--dangerously-skip-permissions',
        ...(this.model === '' ? [] : ['--model', this.model])
      ],
      windows ? { stdio: 'pipe' } : { signal, stdio: 'pipe' }
    );
    if (windows) {
      signal.addEventListener(
        'abort',
        () => spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' }),
        { once: true }
      );
    }
    return child;
  }
}
