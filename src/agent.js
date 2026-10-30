// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import spawn from 'cross-spawn';

/**
 * The executable of a coding agent together with the model it works on.
 * It starts the agent in headless mode with stream-json output and
 * without permission prompts. The model, when not empty, is passed
 * to the agent verbatim. The process gets SIGTERM when the signal
 * aborts. On Windows the executable may be a batch file, such as
 * the claude.cmd that npm installs, so the arguments are quoted for
 * the command interpreter. Killing that interpreter would leave the
 * agent behind it alive, so there the whole process tree is killed.
 */
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
