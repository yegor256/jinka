// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertThat, containsString, hasSize, not, promiseThat, rejected } from 'hamjest';
import { skills } from '../src/skills.js';

const library = async (entries) => {
  const dir = await mkdtemp(join(tmpdir(), 'jinka-'));
  await Promise.all(entries.map(async ([name, text]) => {
    await mkdir(join(dir, name));
    await writeFile(join(dir, name, 'SKILL.md'), text);
  }));
  return dir;
};

describe('skills', () => {
  it('lists the name of every skill', async () => {
    const name = `s-${randomUUID()}`;
    const dir = await library([[`d-${randomUUID()}`, `---\nname: ${name}\ndescription: |\n  Does ${randomUUID()}.\n---\n\n# Ж\n`]]);
    assertThat('name of the skill was not listed', (await skills(dir).lines()).join('\n'), containsString(name));
  });
  it('lists one line per skill', async () => {
    const dir = await library([...Array(3).keys()].map((i) => [`k-${i}-${randomUUID()}`, `---\nname: k${i}\ndescription: |\n  Делает ${randomUUID()}.\n    И ещё ${randomUUID()}.\n---\n`]));
    assertThat('skills were not listed one per line', await skills(dir).lines(), hasSize(3));
  });
  it('joins the lines of a block description into one line', async () => {
    const first = randomUUID();
    const second = randomUUID();
    const dir = await library([[`b-${randomUUID()}`, `---\nname: b\ndescription: |\n  Finds ${first}\n    and ${second}.\n---\n\nBody ${randomUUID()}\n`]]);
    assertThat('block description was not joined', (await skills(dir).lines()).join('\n'), containsString(`Finds ${first} and ${second}.`));
  });
  it('reads a description written on the same line as its key', async () => {
    const text = `Чинит ${randomUUID()}`;
    const dir = await library([[`i-${randomUUID()}`, `---\nname: i\ndescription: ${text}\n---\n`]]);
    assertThat('inline description was not read', (await skills(dir).lines()).join('\n'), containsString(text));
  });
  it('gives the full path of the file of every skill', async () => {
    const name = `p-${randomUUID()}`;
    const dir = await library([[name, `---\nname: p\ndescription: |\n  Pays ${randomUUID()}.\n---\n`]]);
    assertThat('path of the skill file was not given', (await skills(dir).lines()).join('\n'), containsString(join(dir, name, 'SKILL.md')));
  });
  it('leaves the body of the skill out', async () => {
    const body = `Body ${randomUUID()}`;
    const dir = await library([[`o-${randomUUID()}`, `---\nname: o\ndescription: |\n  Opens ${randomUUID()}.\n---\n\n${body}\n`]]);
    assertThat('body of the skill leaked into the list', (await skills(dir).lines()).join('\n'), not(containsString(body)));
  });
  it('ignores files that lie next to the skills', async () => {
    const dir = await library([[`f-${randomUUID()}`, `---\nname: f\ndescription: |\n  Files ${randomUUID()}.\n---\n`]]);
    await writeFile(join(dir, `${randomUUID()}.md`), randomUUID());
    assertThat('stray file was taken for a skill', await skills(dir).lines(), hasSize(1));
  });
  it('fails when a skill has no description', async () => {
    const dir = await library([[`n-${randomUUID()}`, `---\nname: n${randomUUID()}\n---\n`]]);
    await promiseThat('skill without description was not rejected', skills(dir).lines(), rejected());
  });
  it('fails when the directory of skills is absent', async () => {
    await promiseThat('absent directory was not rejected', skills(join(tmpdir(), randomUUID())).lines(), rejected());
  });
});
