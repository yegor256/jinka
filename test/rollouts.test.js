// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertThat, equalTo, hasItem } from 'hamjest';
import { quota } from '../src/quota.js';
import { rollouts } from '../src/rollouts.js';

describe('rollouts', () => {
  it('reads the quota of codex from its session file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rollouts-'));
    const thread = randomUUID();
    mkdirSync(join(dir, '2026', '11', '03'), { recursive: true });
    writeFileSync(
      join(dir, '2026', '11', '03', `rollout-2026-11-03T10-00-00-${thread}.jsonl`),
      `${JSON.stringify({ type: 'event_msg', payload: { type: 'token_count', rate_limits: { primary: { used_percent: 17.0, window_minutes: 300, resets_at: Date.now() / 1000 + 900 }, secondary: null } } })}\n`
    );
    const q = quota();
    const r = rollouts(q, dir);
    r.add(JSON.stringify({ type: 'thread.started', thread_id: thread }));
    r.add(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 31, output_tokens: 7 } }));
    assertThat('codex quota was not read', q.text(Date.now()), equalTo('83%-5H'));
  });
  it('names the window of codex by its length', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rollouts-'));
    const thread = randomUUID();
    writeFileSync(
      join(dir, `rollout-2026-11-03T11-22-33-${thread}.jsonl`),
      `${JSON.stringify({ type: 'event_msg', payload: { type: 'token_count', rate_limits: { primary: { used_percent: 3.0, window_minutes: 300, resets_at: Date.now() / 1000 + 600 }, secondary: { used_percent: 61.0, window_minutes: 43200, resets_at: Date.now() / 1000 + 90000 } } } })}\n`
    );
    const q = quota();
    const r = rollouts(q, dir);
    r.add(JSON.stringify({ type: 'thread.started', thread_id: thread }));
    r.add(JSON.stringify({ type: 'item.completed', item: { id: 'item_4', type: 'agent_message', text: 'ü' } }));
    assertThat('codex window was not named', q.name(Date.now()), equalTo('thirty-day'));
  });
  it('takes the latest rate limits from the session file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rollouts-'));
    const thread = randomUUID();
    writeFileSync(
      join(dir, `rollout-2026-11-03T12-13-14-${thread}.jsonl`),
      [41.0, 52.0].map((used) => JSON.stringify({ type: 'event_msg', payload: { type: 'token_count', rate_limits: { primary: { used_percent: used, window_minutes: 10080, resets_at: Date.now() / 1000 + 5000 } } } })).join('\n')
    );
    const q = quota();
    const r = rollouts(q, dir);
    r.add(JSON.stringify({ type: 'thread.started', thread_id: thread }));
    r.add(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 5, output_tokens: 2 } }));
    assertThat('latest rate limits were not taken', q.text(Date.now()), equalTo('48%-W'));
  });
  it('knows nothing when the session file is missing', () => {
    const q = quota();
    const r = rollouts(q, mkdtempSync(join(tmpdir(), 'rollouts-')));
    r.add(JSON.stringify({ type: 'thread.started', thread_id: randomUUID() }));
    r.add(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 9, output_tokens: 4 } }));
    assertThat('missing session file gave a quota', q.text(Date.now()), equalTo('-'));
  });
  it('knows nothing when the session directory is missing', () => {
    const q = quota();
    const r = rollouts(q, join(tmpdir(), randomUUID()));
    r.add(JSON.stringify({ type: 'thread.started', thread_id: randomUUID() }));
    r.add(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 9, output_tokens: 4 } }));
    assertThat('missing session directory gave a quota', q.text(Date.now()), equalTo('-'));
  });
  it('passes every line to its origin', () => {
    const lines = [];
    const line = JSON.stringify({ type: 'item.started', item: { id: 'item_2', type: 'command_execution', command: `ls ${randomUUID()}` } });
    rollouts({ add: (text) => lines.push(text) }, mkdtempSync(join(tmpdir(), 'rollouts-'))).add(line);
    assertThat('line was not passed to the origin', lines, hasItem(line));
  });
});
