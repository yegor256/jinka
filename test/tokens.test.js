// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { styleText } from 'node:util';
import { assertThat, equalTo } from 'hamjest';
import { tokens } from '../src/tokens.js';

describe('tokens', () => {
  it('counts nothing from the start', () => {
    assertThat('fresh counter is not empty', tokens().text(), equalTo('0'));
  });
  it('sums every kind of tokens of a message', () => {
    const t = tokens();
    t.add(JSON.stringify({
      type: 'assistant',
      message: { id: randomUUID(), usage: { input_tokens: 7, output_tokens: 311, cache_read_input_tokens: 52, cache_creation_input_tokens: 19 } }
    }));
    assertThat('tokens were not summed', t.text(), equalTo('389'));
  });
  it('sums tokens of different messages', () => {
    const t = tokens();
    t.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 104 } } }));
    t.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 23 } } }));
    assertThat('messages were not summed', t.text(), equalTo('127'));
  });
  it('dont count one message twice', () => {
    const t = tokens();
    const line = JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { input_tokens: 3, output_tokens: 86 } } });
    t.add(line);
    t.add(line);
    assertThat('message was counted twice', t.text(), equalTo('89'));
  });
  it('dont count lines without usage', () => {
    const t = tokens();
    t.add(`not a json ${randomUUID()}`);
    t.add(JSON.stringify({ type: 'result', usage: { output_tokens: 9_999 } }));
    t.add(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: randomUUID() }] } }));
    assertThat('lines without usage were counted', t.text(), equalTo('0'));
  });
  it('prints large numbers in a short form', () => {
    const t = tokens();
    t.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { cache_read_input_tokens: 234_567 } } }));
    assertThat('large number was not shortened', t.text(), equalTo('234.6K'));
  });
  it('prints more than a million tokens in red', () => {
    const t = tokens();
    t.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { cache_read_input_tokens: 1_734_219 } } }));
    assertThat('million tokens were not red', t.text(), equalTo(styleText('red', '1.7M', { validateStream: false })));
  });
  it('dont print exactly a million tokens in red', () => {
    const t = tokens();
    t.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 1_000_000 } } }));
    assertThat('exactly a million tokens were red', t.text(), equalTo('1M'));
  });
  it('sums the tokens of a turn of codex', () => {
    const t = tokens();
    t.add(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 12_939, cached_input_tokens: 10_880, output_tokens: 61, reasoning_output_tokens: 17 } }));
    assertThat('codex tokens were not summed', t.text(), equalTo('13K'));
  });
  it('sums the tokens of different turns of codex', () => {
    const t = tokens();
    t.add(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 41, output_tokens: 3 } }));
    t.add(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 57, output_tokens: 8 } }));
    assertThat('codex turns were not summed', t.text(), equalTo('109'));
  });
});
