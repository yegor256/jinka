#!/usr/bin/env node
// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { Command, Option, InvalidArgumentError } from 'commander';
import { readFile } from 'node:fs/promises';
import { resolve, join, dirname, parse } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { jinka } from '../src/jinka.js';
import { wishes } from '../src/wishes.js';
import { agent } from '../src/agent.js';
import { claude } from '../src/claude.js';
import { codex } from '../src/codex.js';
import { genie } from '../src/genie.js';
import { disk } from '../src/disk.js';
import { tty } from '../src/tty.js';
import { colorless } from '../src/colorless.js';
import { log } from '../src/log.js';
import { pile } from '../src/pile.js';
import { status } from '../src/status.js';
import { quota } from '../src/quota.js';
import { rollouts } from '../src/rollouts.js';
import { recorded } from '../src/recorded.js';
import { model } from '../src/model.js';
import { meters } from '../src/meters.js';
import { freeze } from '../src/freeze.js';
import { frozen } from '../src/frozen.js';
import { limited } from '../src/limited.js';
import { throttled } from '../src/throttled.js';
import { keys } from '../src/keys.js';
import { wheel } from '../src/wheel.js';
import { legend } from '../src/legend.js';
import { release } from '../src/release.js';
import { tokens } from '../src/tokens.js';
import { crew } from '../src/crew.js';
import { jobs } from '../src/jobs.js';
import { summary } from '../src/summary.js';
import { summarized } from '../src/summarized.js';
import { semaphore } from '../src/semaphore.js';
import { hello } from '../src/hello.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const positive = (text) => {
  const number = Number(text);
  if (!Number.isInteger(number) || number < 1) {
    throw new InvalidArgumentError(`A positive integer is expected, but got "${text}"`);
  }
  return number;
};
const percent = (text) => {
  const number = Number(text);
  if (!Number.isInteger(number) || number < 0 || number > 100) {
    throw new InvalidArgumentError(`An integer percent from 0 to 100 is expected, but got "${text}"`);
  }
  return number;
};
const natural = (text) => {
  const number = Number(text);
  if (!Number.isInteger(number) || number < 0) {
    throw new InvalidArgumentError(`A non-negative integer is expected, but got "${text}"`);
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
  .description(`${pkg.description} (${pkg.version})`)
  .version(pkg.version)
  .configureHelp({ sortOptions: true })
  .showHelpAfterError('(add --help for additional information)')
  .addOption(new Option('--wishes <dir>', 'directory with wishes, one per Markdown file').default(join(homedir(), '.jinka', 'wishes'), '~/.jinka/wishes'))
  .option('--threads <n>', `how many wishes run at once, up to ${limit}, which the + and - keys change while running`, bounded, 6)
  .addOption(new Option('--archive <dir>', 'directory where finished wishes are moved instead of being deleted').default(join(homedir(), '.jinka', 'archive'), '~/.jinka/archive'))
  .addOption(new Option('--logs <dir>', 'directory where the output of every agent run is saved').default(join(homedir(), '.jinka', 'logs'), '~/.jinka/logs'))
  .addOption(new Option('--memory <dir>', 'directory where agents keep what they learn about repositories between runs').default(join(homedir(), '.jinka', 'memory'), '~/.jinka/memory'))
  .addOption(new Option('--skill <dir>', 'directory with the plugin of skills that the agent loads').default(join(root, 'plugin'), 'skills bundled with jinka'))
  .option('--slack <sec>', 'how many seconds a thread rests after a wish before it takes the next wish', natural, 5)
  .addOption(new Option('--engine <name>', 'kind of agent to run, guessed from the name of the agent executable when not given').choices(['claude', 'codex']))
  .addOption(new Option('--agent <cmd>', 'agent executable to run').default('', 'the name of the engine'))
  .option('--interval <ms>', 'how often the wishes directory is scanned', positive, 5000)
  .option('--pause <ms>', 'how long a capitalized wish that was there at startup waits after a success before it runs again', positive, 60000)
  .addOption(new Option('--model <name>', 'model passed to the agent').default('', 'agent default'))
  .addOption(new Option('--effort <level>', 'reasoning effort passed to the agent, such as low, medium, high, xhigh, or max').default('', 'agent default'))
  .option('--throttle <percent>', 'how much of the agent quota, in percent, must be left in every window before a new job starts', percent, 15)
  .addOption(new Option('--pid <file>', 'file that exists while jinka runs, so that a second jinka refuses to start').default(join(homedir(), '.jinka', 'pid.txt'), '~/.jinka/pid.txt'))
  .option('--no-color', 'paint nothing in the terminal, which a non-empty NO_COLOR environment variable also does')
  .option('--no-tui', 'print only the protocol, without the status bars and the list of threads')
  .addOption(new Option('--limit <n>', 'how many jobs start before jinka waits for them to finish and quits').argParser(positive).default(Infinity, 'unlimited'))
  .parse();
const values = program.opts();
const s = semaphore(resolve(values.pid));
await s.acquire().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
process.on('exit', () => s.release());
const dir = resolve(values.wishes);
const engine = values.engine ?? (parse(values.agent).name === 'codex' ? 'codex' : 'claude');
const a = values.agent === '' ? engine : values.agent;
const t = tokens();
const q = quota();
const c = crew(values.threads, limit, { warn: (text) => screen.notice().warn(text) });
const sessions = join(process.env.CODEX_HOME ?? join(homedir(), '.codex'), 'sessions');
const e = (engine === 'codex' ? codex : claude)(agent(a), values.model, values.effort, resolve(values.skill));
const d = disk(dir, resolve(values.logs), resolve(values.memory), c);
const j = jobs(genie(e, d, meters([t, engine === 'codex' ? rollouts(q, sessions) : q]), engine === 'codex' ? () => recorded(model(), sessions) : model));
const f = freeze(c, { warn: (text) => screen.notice().warn(text) }, () => quit(0));
const r = release(pkg.version, 'https://registry.npmjs.org/@yegor256/jinka/latest');
const start = Date.now();
const tui = process.stdout.isTTY && values.tui;
const screen = summarized(
  tui
    ? tty(
      values.color && !process.env.NO_COLOR ? process.stdout : colorless(process.stdout),
      c,
      status(start, pile(dir), j, a, values.model, t, q),
      legend(f, r)
    )
    : log(process.stdout),
  summary(start, pkg.version, j, { agent: a, model: values.model, effort: values.effort, wishes: dir, tokens: t }),
  process.stdout
);
process.on('exit', () => screen.close());
if (tui) {
  r.check();
}
screen.notice().warn(`every agent starts as: ${e.command(d.args())}`);
const quit = (code) => {
  screen.close();
  process.stdout.write('', () => process.stderr.write('', () => process.exit(code)));
};
const controller = new AbortController();
const interrupt = () => {
  if (controller.signal.aborted) {
    process.exit(130);
  }
  controller.abort();
};
process.on('SIGINT', interrupt);
keys(process.stdin, f, c, interrupt).listen();
wheel(process.stdin, screen).listen();
try {
  await hello(e, screen.notice()).run(controller.signal);
  await jinka(
    limited(frozen(throttled(wishes(dir, values.interval, values.archive === '' ? '' : resolve(values.archive), values.pause, { warn: (text) => screen.notice().warn(text) }), q, values.throttle, 15 * 60 * 1000, { warn: (text) => screen.notice().warn(text) }), f), values.limit, f),
    j,
    screen,
    c,
    values.slack
  ).run(controller.signal);
  quit(130);
} catch (e) {
  screen.close();
  console.error(e);
  quit(1);
}
