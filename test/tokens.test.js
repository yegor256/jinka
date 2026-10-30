// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo } from 'hamjest';
import { Tokens } from '../src/tokens.js';

describe('Tokens', () => {
  it('counts nothing from the start', () => {
    assertThat('fresh counter is not empty', new Tokens().text(), equalTo('0'));
  });
  it('sums every kind of tokens of a message', () => {
    const tokens = new Tokens();
    tokens.add(JSON.stringify({
      type: 'assistant',
      message: { id: randomUUID(), usage: { input_tokens: 7, output_tokens: 311, cache_read_input_tokens: 52, cache_creation_input_tokens: 19 } }
    }));
    assertThat('tokens were not summed', tokens.text(), equalTo('389'));
  });
  it('sums tokens of different messages', () => {
    const tokens = new Tokens();
    tokens.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 104 } } }));
    tokens.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { output_tokens: 23 } } }));
    assertThat('messages were not summed', tokens.text(), equalTo('127'));
  });
  it('dont count one message twice', () => {
    const tokens = new Tokens();
    const line = JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { input_tokens: 3, output_tokens: 86 } } });
    tokens.add(line);
    tokens.add(line);
    assertThat('message was counted twice', tokens.text(), equalTo('89'));
  });
  it('dont count lines without usage', () => {
    const tokens = new Tokens();
    tokens.add(`not a json ${randomUUID()}`);
    tokens.add(JSON.stringify({ type: 'result', usage: { output_tokens: 9_999 } }));
    tokens.add(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: randomUUID() }] } }));
    assertThat('lines without usage were counted', tokens.text(), equalTo('0'));
  });
  it('prints large numbers in a short form', () => {
    const tokens = new Tokens();
    tokens.add(JSON.stringify({ type: 'assistant', message: { id: randomUUID(), usage: { cache_read_input_tokens: 1_234_567 } } }));
    assertThat('large number was not shortened', tokens.text(), equalTo('1.2M'));
  });
});
