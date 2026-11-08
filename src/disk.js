// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { createWriteStream } from 'node:fs';
import { mkdir, readdir } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';

export const disk = (wishes, logs, memory, crew) => Object.freeze({
  lines: async (wish) => {
    const count = (await readdir(wishes, { recursive: true, withFileTypes: true }))
      .filter((f) => f.isFile() && f.name.endsWith('.md'))
      .length;
    return [
      `The wish is written in the file ${join(wishes, wish.name())}, ${wish.fate()}.`,
      'Never delete, move, or rename the file of this wish yourself, even after you split it into smaller wishes, since Jinka takes care of it.',
      'Never modify any existing wish file, neither the file of this wish nor any other, since every wish file is read-only for you.',
      `All wishes live in the directory ${wishes}, and you may add new wishes there as Markdown files.`,
      `Never write a new wish if a similar wish already exists anywhere in the directory ${wishes}, so look through the existing wishes before you write one.`,
      `If this wish is an atomic job that involves no other jobs, make it come true yourself;`,
      `otherwise, do not do it yourself, but split it into smaller wishes`,
      `and write each of them as a separate Markdown file in the directory ${join(wishes, dirname(wish.name()))}.`,
      `Always start the name of every new wish file with a small English letter, never with a capital one.`,
      'Write every new wish the way a person would ask for something, in a few plain sentences that say what must be achieved and give exact links to the issue, pull request, or repository.',
      'Keep every new wish shorter than 1000 characters.',
      'Never copy the text of the current wish, or of these instructions, into a new wish, since Jinka gives these instructions to every wish anyway;',
      'copy into it, word for word, only what the user wrote in a permanent wish and explicitly asked to pass along, such as a chat ID or a token.',
      `Never let a new wish refer to any file in the directory ${memory}, and never carry into it any rule, condition, or contract that you invented, nor ask it to pass rules onward.`,
      'Leave evidence, observations, logs, and the history of your work out of a new wish, since the new wish checks the current state by itself.',
      `Write at most ${crew.size()} new wishes while doing this wish;`,
      'if more work remains than they can hold, make one of them a continuation that splits the rest later.',
      `The directory ${wishes} holds ${count} wishes right now.`,
      ...(count >= 100 ? ['Since that is 100 or more, write no new wish at all, but do only one small piece of this wish yourself, such as one repository or one item, and then finish, leaving the rest for the next time a permanent wish runs.'] : []),
      `In every Git repository you touch, do all your work inside a separate Git worktree, never in the main directory of the repository, so that other wishes running at the same time do not see your changes.`,
      `Never spend time waiting while doing a wish, neither sleeping nor polling for a build, a review, a merge, or anything else;`,
      `if something must happen first, leave that work alone and complete the current wish right away, since the permanent wish that led here comes back to it later;`,
      'write a new wish only for work that nothing else would ever pick up again.',
      'Never schedule work for later through cron, launchd, at, a task scheduler, or any scheduling feature of your own.',
      `Your memory lives in the directory ${memory}; keep there only what a skill tells you to keep, and never write anything else there, especially not logs, handoffs, or instructions for other wishes.`,
      `Jinka runs ${crew.size()} threads right now, so up to ${crew.size()} wishes run at once.`
    ];
  },
  args: () => ['--add-dir', wishes, '--add-dir', memory],
  log: async (wish) => {
    const file = join(
      logs,
      `${wish.name().slice(0, wish.name().length - extname(wish.name()).length)}-${new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)}.jsonl`
    );
    await mkdir(dirname(file), { recursive: true });
    await mkdir(memory, { recursive: true });
    return createWriteStream(file);
  }
});
