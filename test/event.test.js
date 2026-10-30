// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { assertThat, equalTo } from 'hamjest';
import { Event } from '../src/event.js';

describe('Event', () => {
  it('turns a tool call into a short phrase', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'gh pr list --repo foo/bar' } }] }
    });
    assertThat('tool call was not summarized', new Event(line).text(), equalTo('Bash: gh pr list --repo foo/bar'));
  });
  it('keeps only the first line of the agent text', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'text', text: '\nReading the issue body\nand more' }] }
    });
    assertThat('first line was not kept', new Event(line).text(), equalTo('Reading the issue body'));
  });
  it('names a tool without input by its name', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'TodoWrite', input: {} }] }
    });
    assertThat('tool name was not shown', new Event(line).text(), equalTo('TodoWrite'));
  });
  it('stays silent on tool results', () => {
    const line = JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result' }] } });
    assertThat('tool result was not ignored', new Event(line).text(), equalTo(''));
  });
  it('reports the final result', () => {
    const line = JSON.stringify({ type: 'result', subtype: 'success', result: 'Merged two PRs\nDetails' });
    assertThat('result was not reported', new Event(line).text(), equalTo('Merged two PRs'));
  });
  it('shows a line that is not json as it is', () => {
    assertThat('plain line was lost', new Event('  plain words  ').text(), equalTo('plain words'));
  });
});
