// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo } from 'hamjest';
import { model } from '../src/model.js';

describe('model', () => {
  it('knows nothing from the start', () => {
    assertThat('fresh model is not empty', model().text(), equalTo(''));
  });
  it('shortens the model of the agent', () => {
    const m = model();
    m.add(JSON.stringify({ type: 'system', subtype: 'init', session_id: randomUUID(), model: 'claude-sonnet-4-5-20250929' }));
    assertThat('model was not shortened', m.text(), equalTo('Sonnet4.5'));
  });
  it('shortens a model without a date', () => {
    const m = model();
    m.add(JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-haiku-5-5' }));
    assertThat('model without a date was not shortened', m.text(), equalTo('Haiku5.5'));
  });
  it('shortens a model with the version in front', () => {
    const m = model();
    m.add(JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-3-7-sonnet-20250219' }));
    assertThat('model with the version in front was not shortened', m.text(), equalTo('Sonnet3.7'));
  });
  it('ignores events that are not the start of a session', () => {
    const m = model();
    m.add(JSON.stringify({ type: 'assistant', message: { model: `claude-${randomUUID()}` } }));
    assertThat('wrong event changed the model', m.text(), equalTo(''));
  });
  it('ignores a line that is not JSON', () => {
    const m = model();
    m.add(`{ ${randomUUID()}`);
    assertThat('broken line changed the model', m.text(), equalTo(''));
  });
});
