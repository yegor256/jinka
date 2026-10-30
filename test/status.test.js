// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, startsWith, endsWith } from 'hamjest';
import { Status } from '../src/status.js';

describe('Status', () => {
  it('shows the version and the uptime', () => {
    const version = randomUUID();
    assertThat('status line is wrong', new Status(version, Date.now() - 3_725_000, 'opus').text(), startsWith(`jinka ${version}, up 01:02:05`));
  });
  it('shows the model of the agents', () => {
    const model = randomUUID();
    assertThat('model is not shown', new Status('0.0.1', Date.now(), model).text(), endsWith(`, model ${model}`));
  });
  it('shows the default model when none is chosen', () => {
    assertThat('default model is not shown', new Status('0.0.2', Date.now(), '').text(), endsWith(', model default'));
  });
});
