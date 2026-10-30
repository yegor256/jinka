// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * A fake agent, generated at runtime as a tiny executable Node script.
 * On Windows, which ignores the shebang line, the script is started
 * by a batch file next to it, the way npm starts claude there.
 * It reads the prompt from its standard input, prints every prompt line
 * and its own arguments as stream-json events, reports its exit code
 * to the standard error, waits, and exits with the given code.
 */
export class Script {
  constructor(code, delay = 0) {
    this.code = code;
    this.delay = delay;
  }
  async path() {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const file = join(dir, 'agent.js');
    await writeFile(
      file,
      [
        '#!/usr/bin/env node',
        "let input = '';",
        "process.stdin.on('data', (d) => { input += d; });",
        "process.stdin.on('end', () => {",
        "  const say = (t) => console.log(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: t }] } }));",
        "  input.split('\\n').filter((l) => l !== '').forEach(say);",
        "  say(process.argv.slice(2).join(' '));",
        `  console.error('Exiting with code ${this.code}');`,
        `  setTimeout(() => process.exit(${this.code}), ${this.delay});`,
        '});'
      ].join('\n'),
      { mode: 0o755 }
    );
    if (process.platform !== 'win32') {
      return file;
    }
    const cmd = join(dir, 'agent.cmd');
    await writeFile(cmd, `@"${process.execPath}" "%~dp0agent.js" %*\r\n`);
    return cmd;
  }
}
