// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertThat, equalTo } from 'hamjest';
import { model } from '../src/model.js';
import { recorded } from '../src/recorded.js';

describe('recorded', () => {
  it('reads the model of codex from its session file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'recorded-'));
    const thread = randomUUID();
    const name = `gpt-${randomUUID()}`;
    mkdirSync(join(dir, '2026', '11', '05'), { recursive: true });
    writeFileSync(
      join(dir, '2026', '11', '05', `rollout-2026-11-05T19-14-01-${thread}.jsonl`),
      `${JSON.stringify({ type: 'turn_context', payload: { turn_id: randomUUID(), model: name } })}\n`
    );
    const m = recorded(model(), dir);
    m.add(JSON.stringify({ type: 'thread.started', thread_id: thread }));
    m.add(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 17, output_tokens: 3 } }));
    assertThat('codex model was not read', m.text(), equalTo(name));
  });
  it('takes the latest model from the session file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'recorded-'));
    const thread = randomUUID();
    writeFileSync(
      join(dir, `rollout-2026-11-05T20-01-02-${thread}.jsonl`),
      ['gpt-5.4-ö', 'gpt-5.6-terra'].map((name) => JSON.stringify({ type: 'turn_context', payload: { model: name } })).join('\n')
    );
    const m = recorded(model(), dir);
    m.add(JSON.stringify({ type: 'thread.started', thread_id: thread }));
    m.add(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 4, output_tokens: 9 } }));
    assertThat('latest codex model was not taken', m.text(), equalTo('gpt-5.6-terra'));
  });
  it('knows nothing when the session file is missing', () => {
    const m = recorded(model(), mkdtempSync(join(tmpdir(), 'recorded-')));
    m.add(JSON.stringify({ type: 'thread.started', thread_id: randomUUID() }));
    m.add(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 8, output_tokens: 1 } }));
    assertThat('missing session file gave a model', m.text(), equalTo(''));
  });
  it('knows nothing when the session directory is missing', () => {
    const m = recorded(model(), join(tmpdir(), randomUUID()));
    m.add(JSON.stringify({ type: 'thread.started', thread_id: randomUUID() }));
    m.add(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 2, output_tokens: 6 } }));
    assertThat('missing session directory gave a model', m.text(), equalTo(''));
  });
  it('passes every line to its origin', () => {
    const m = recorded(model(), mkdtempSync(join(tmpdir(), 'recorded-')));
    m.add(JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-opus-5-5' }));
    assertThat('line was not passed to the origin', m.text(), equalTo('Opus5.5'));
  });
});
