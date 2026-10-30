// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { stripVTControlCharacters } from 'node:util';
import { assertThat, startsWith, endsWith, containsString } from 'hamjest';
import { Status } from '../src/status.js';
import { Tokens } from '../src/tokens.js';

describe('Status', () => {
  it('shows the version and the uptime', () => {
    const version = randomUUID();
    assertThat('status line is wrong', stripVTControlCharacters(new Status(version, Date.now() - 3_725_000, 'opus', new Tokens()).text()), startsWith(`jinka ${version}, up 01:02:05`));
  });
  it('shows the model of the agents', () => {
    const model = randomUUID();
    assertThat('model is not shown', stripVTControlCharacters(new Status('0.0.1', Date.now(), model, new Tokens()).text()), containsString(`, model ${model},`));
  });
  it('shows the default model when none is chosen', () => {
    assertThat('default model is not shown', stripVTControlCharacters(new Status('0.0.2', Date.now(), '', new Tokens()).text()), containsString(', model default,'));
  });
  it('shows the tokens used by the agents', () => {
    const tokens = new Tokens();
    tokens.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 4_721 } } }));
    assertThat('tokens are not shown', stripVTControlCharacters(new Status('0.0.3', Date.now(), 'haiku', tokens).text()), endsWith(', tokens 4.7K'));
  });
  it('paints the version on a dark gray background', () => {
    const version = randomUUID();
    assertThat('version is not painted dark gray', new Status(version, Date.now(), 'opus', new Tokens()).text(), startsWith(`jinka \x1b[100m${version}\x1b[49m,`));
  });
  it('paints the uptime on a dark gray background', () => {
    assertThat('uptime is not painted dark gray', new Status('0.0.4', Date.now() - 7_384_000, 'opus', new Tokens()).text(), containsString(', up \x1b[100m02:03:04\x1b[49m,'));
  });
  it('paints the model on a dark gray background', () => {
    const model = randomUUID();
    assertThat('model is not painted dark gray', new Status('0.0.5', Date.now(), model, new Tokens()).text(), containsString(`, model \x1b[100m${model}\x1b[49m,`));
  });
  it('paints the tokens on a dark gray background', () => {
    const tokens = new Tokens();
    tokens.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 813 } } }));
    assertThat('tokens are not painted gray', new Status('0.0.6', Date.now(), 'sonnet', tokens).text(), endsWith(', tokens \x1b[100m813\x1b[49m'));
  });
});
