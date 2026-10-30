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
 * the command interpreter.
 */
export class Agent {
  constructor(command, model) {
    this.command = command;
    this.model = model;
  }
  start(args, signal) {
    return spawn(
      this.command,
      [
        '-p', '--output-format', 'stream-json', '--verbose',
        ...args,
        '--dangerously-skip-permissions',
        ...(this.model === '' ? [] : ['--model', this.model])
      ],
      { signal, stdio: 'pipe' }
    );
  }
}
