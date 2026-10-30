// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { randomUUID } from 'node:crypto';
import { assertThat, equalTo } from 'hamjest';
import { Model } from '../src/model.js';

describe('Model', () => {
  it('knows nothing from the start', () => {
    assertThat('fresh model is not empty', new Model().text(), equalTo(''));
  });
  it('shortens the model of the agent', () => {
    const model = new Model();
    model.add(JSON.stringify({ type: 'system', subtype: 'init', session_id: randomUUID(), model: 'claude-sonnet-4-5-20250929' }));
    assertThat('model was not shortened', model.text(), equalTo('Sonnet4.5'));
  });
  it('shortens a model without a date', () => {
    const model = new Model();
    model.add(JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-haiku-5-5' }));
    assertThat('model without a date was not shortened', model.text(), equalTo('Haiku5.5'));
  });
  it('shortens a model with the version in front', () => {
    const model = new Model();
    model.add(JSON.stringify({ type: 'system', subtype: 'init', model: 'claude-3-7-sonnet-20250219' }));
    assertThat('model with the version in front was not shortened', model.text(), equalTo('Sonnet3.7'));
  });
  it('ignores events that are not the start of a session', () => {
    const model = new Model();
    model.add(JSON.stringify({ type: 'assistant', message: { model: `claude-${randomUUID()}` } }));
    assertThat('wrong event changed the model', model.text(), equalTo(''));
  });
  it('ignores a line that is not JSON', () => {
    const model = new Model();
    model.add(`{ ${randomUUID()}`);
    assertThat('broken line changed the model', model.text(), equalTo(''));
  });
});
