// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const script = (code, delay = 0, lines = [], name = 'agent', errors = []) => Object.freeze({
  path: async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
    const file = join(dir, `${name}.js`);
    await writeFile(
      file,
      [
        '#!/usr/bin/env node',
        "let input = '';",
        "process.stdin.on('data', (d) => { input += d; });",
        "process.stdin.on('end', () => {",
        ...errors.map((e) => `  console.error(${JSON.stringify(e)});`),
        `  setTimeout(() => {`,
        "  const say = (t) => console.log(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: t }] } }));",
        ...lines.map((l) => `  console.log(${JSON.stringify(l)});`),
        "  input.split('\\n').filter((l) => l !== '').forEach(say);",
        "  say(process.argv.slice(2).join(' '));",
        `  console.log(JSON.stringify({ type: 'result', result: 'Finished with code ${code}' }));`,
        `  console.error('Exiting with code ${code}');`,
        `  setTimeout(() => process.exit(${code}), ${delay});`,
        `  }, ${errors.length > 0 ? 500 : 0});`,
        '});'
      ].join('\n'),
      { mode: 0o755 }
    );
    if (process.platform !== 'win32') {
      return file;
    }
    const cmd = join(dir, `${name}.cmd`);
    await writeFile(cmd, `@"${process.execPath}" "%~dp0${name}.js" %*\r\n`);
    return cmd;
  }
});
