// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, startsWith, endsWith, containsString } from 'hamjest';
import { Status } from '../src/status.js';
import { Tokens } from '../src/tokens.js';

describe('Status', () => {
  it('shows the version and the uptime', () => {
    const version = randomUUID();
    assertThat('status line is wrong', new Status(version, Date.now() - 3_725_000, 'opus', new Tokens()).text(), startsWith(`jinka ${version}, up 01:02:05`));
  });
  it('shows the model of the agents', () => {
    const model = randomUUID();
    assertThat('model is not shown', new Status('0.0.1', Date.now(), model, new Tokens()).text(), containsString(`, model ${model},`));
  });
  it('shows the default model when none is chosen', () => {
    assertThat('default model is not shown', new Status('0.0.2', Date.now(), '', new Tokens()).text(), containsString(', model default,'));
  });
  it('shows the tokens used by the agents', () => {
    const tokens = new Tokens();
    tokens.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 4_721 } } }));
    assertThat('tokens are not shown', new Status('0.0.3', Date.now(), 'haiku', tokens).text(), endsWith(', tokens 4.7K'));
  });
});
