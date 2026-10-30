#!/usr/bin/env node
// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Jinka } from '../src/jinka.js';
import { Wishes } from '../src/wishes.js';
import { Claude } from '../src/claude.js';
import { Tty } from '../src/tty.js';
import { Log } from '../src/log.js';
import { Status } from '../src/status.js';
import { Freeze } from '../src/freeze.js';
import { Frozen } from '../src/frozen.js';
import { Keys } from '../src/keys.js';
import { Legend } from '../src/legend.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    threads: { type: 'string', default: '8' },
    archive: { type: 'string', default: '' },
    agent: { type: 'string', default: 'claude' },
    interval: { type: 'string', default: '5000' },
    model: { type: 'string', default: '' }
  }
});
if (positionals.length !== 1) {
  console.error('Usage: jinka [--threads 8] [--archive DIR] [--agent claude] [--interval 5000] [--model MODEL] WISHES');
  process.exit(1);
}
const threads = Number(values.threads);
const interval = Number(values.interval);
if (!Number.isInteger(threads) || threads < 1 || !Number.isInteger(interval) || interval < 1) {
  console.error(`The --threads and --interval options must be positive integers, but got "${values.threads}" and "${values.interval}"`);
  process.exit(1);
}
const dir = resolve(positionals[0]);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const freeze = new Freeze(threads, () => process.exit(0));
const screen = process.stdout.isTTY
  ? new Tty(
    process.stdout,
    threads,
    new Status(JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version, Date.now(), values.model),
    new Legend(freeze)
  )
  : new Log(process.stdout);
process.on('exit', () => screen.close());
const controller = new AbortController();
const interrupt = () => {
  if (controller.signal.aborted) {
    process.exit(130);
  }
  controller.abort();
};
process.on('SIGINT', interrupt);
if (process.stdin.isTTY) {
  new Keys(process.stdin, freeze, interrupt).listen();
}
try {
  await new Jinka(
    new Frozen(new Wishes(dir, interval, values.archive === '' ? '' : resolve(values.archive)), freeze),
    new Claude(values.agent, join(root, 'plugin'), dir, values.model),
    screen,
    threads
  ).run(controller.signal);
  process.exit(130);
} catch (e) {
  screen.close();
  console.error(e.message);
  process.exit(1);
}
