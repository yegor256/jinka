// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import spawn from 'cross-spawn';

export const agent = (command) => Object.freeze({
  start: (args, signal) => {
    const windows = process.platform === 'win32';
    const child = spawn(command, args, windows ? { stdio: 'pipe' } : { signal, stdio: 'pipe' });
    if (windows) {
      signal.addEventListener(
        'abort',
        () => spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' }),
        { once: true }
      );
    }
    return child;
  },
  command: (args) => [command, ...args].map((a) => (/^[\w./\\:=@%+,-]+$/.test(a) ? a : `'${a.replaceAll("'", "'\\''")}'`)).join(' ')
});
