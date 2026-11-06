// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';

export const disk = (wishes, logs, memory, crew) => Object.freeze({
  lines: (wish) => [
    `The wish is written in the file ${join(wishes, wish.name())}, ${wish.fate()}.`,
    'Never delete, move, or rename the file of this wish yourself, even after you split it into smaller wishes, since Jinka takes care of it.',
    `All wishes live in the directory ${wishes}, and you may add new wishes there as Markdown files.`,
    `If this wish is an atomic job that involves no other jobs, make it come true yourself;`,
    `otherwise, do not do it yourself, but split it into smaller wishes`,
    `and write each of them as a separate Markdown file in the directory ${join(wishes, dirname(wish.name()))}.`,
    `Always start the name of every new wish file with a small English letter, never with a capital one.`,
    'Write every new wish the way a person would ask for something, in a few plain sentences that say what must be achieved and give exact links to the issue, pull request, or repository.',
    'Keep every new wish shorter than 1000 characters.',
    'Never copy the text of the current wish, or of these instructions, into a new wish, since Jinka gives these instructions to every wish anyway;',
    'copy only the facts that the new wish cannot find on its own, such as a chat ID or a token that the current wish explicitly asks to pass along.',
    'Leave evidence, observations, logs, and the history of your work out of a new wish, since the new wish checks the current state by itself.',
    `In every Git repository you touch, do all your work inside a separate Git worktree, never in the main directory of the repository, so that other wishes running at the same time do not see your changes.`,
    `Never spend time waiting while doing a wish, neither sleeping nor polling for a build, a review, a merge, or anything else;`,
    `if something must happen first, write a new wish that waits for it and finishes the job, and then complete the current wish right away.`,
    `Your memory lives in the directory ${memory}, keep there what the skills tell you to keep.`,
    `Jinka runs ${crew.size()} threads right now, so up to ${crew.size()} wishes run at once.`
  ],
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
