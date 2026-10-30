// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export class Script {
  constructor(code, delay = 0, lines = []) {
    this.code = code;
    this.delay = delay;
    this.lines = lines;
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
        ...this.lines.map((l) => `  console.log(${JSON.stringify(l)});`),
        "  input.split('\\n').filter((l) => l !== '').forEach(say);",
        "  say(process.argv.slice(2).join(' '));",
        `  console.log(JSON.stringify({ type: 'result', result: 'Finished with code ${this.code}' }));`,
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
