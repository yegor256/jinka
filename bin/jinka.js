#!/usr/bin/env node
// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Command, Option, InvalidArgumentError } from 'commander';
import { readFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Jinka } from '../src/jinka.js';
import { Wishes } from '../src/wishes.js';
import { Agent } from '../src/agent.js';
import { Claude } from '../src/claude.js';
import { Tty } from '../src/tty.js';
import { Log } from '../src/log.js';
import { Status } from '../src/status.js';
import { Freeze } from '../src/freeze.js';
import { Frozen } from '../src/frozen.js';
import { Keys } from '../src/keys.js';
import { Legend } from '../src/legend.js';
import { Tokens } from '../src/tokens.js';
import { Crew } from '../src/crew.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const positive = (text) => {
  const number = Number(text);
  if (!Number.isInteger(number) || number < 1) {
    throw new InvalidArgumentError(`A positive integer is expected, but got "${text}"`);
  }
  return number;
};
const limit = 16;
const bounded = (text) => {
  const number = positive(text);
  if (number > limit) {
    throw new InvalidArgumentError(`At most ${limit} threads are allowed, but got "${text}"`);
  }
  return number;
};
const program = new Command()
  .name('jinka')
  .description(pkg.description)
  .version(pkg.version)
  .showHelpAfterError('(add --help for additional information)')
  .addOption(new Option('--wishes <dir>', 'directory with wishes, one per Markdown file').default(join(homedir(), '.jinka', 'wishes'), '~/.jinka/wishes'))
  .option('--threads <n>', `how many wishes run at once, up to ${limit}, which the + and - keys change while running`, bounded, 8)
  .addOption(new Option('--archive <dir>', 'directory where finished wishes are moved instead of being deleted').default(join(homedir(), '.jinka', 'archive'), '~/.jinka/archive'))
  .addOption(new Option('--logs <dir>', 'directory where the output of every agent run is saved').default(join(homedir(), '.jinka', 'logs'), '~/.jinka/logs'))
  .option('--agent <cmd>', 'agent executable to run', 'claude')
  .option('--interval <ms>', 'how often the wishes directory is scanned', positive, 5000)
  .option('--pause <ms>', 'how long a capitalized wish that was there at startup waits after a success before it runs again', positive, 60000)
  .addOption(new Option('--model <name>', 'model passed to the agent').default('', 'agent default'))
  .parse();
const values = program.opts();
const dir = resolve(values.wishes);
const tokens = new Tokens();
const crew = new Crew(values.threads, limit, { show: (text) => screen.notice().show(text) });
const freeze = new Freeze(crew, () => process.exit(0));
const screen = process.stdout.isTTY
  ? new Tty(
    process.stdout,
    crew,
    new Status(pkg.version, Date.now(), values.model, tokens),
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
new Keys(process.stdin, freeze, crew, interrupt).listen();
try {
  await new Jinka(
    new Frozen(new Wishes(dir, values.interval, values.archive === '' ? '' : resolve(values.archive), values.pause), freeze),
    new Claude(new Agent(values.agent, values.model), join(root, 'plugin'), dir, resolve(values.logs), tokens),
    screen,
    crew
  ).run(controller.signal);
  process.exit(130);
} catch (e) {
  screen.close();
  console.error(e.message);
  process.exit(1);
}
