// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { assertThat, equalTo } from 'hamjest';
import { Event } from '../src/event.js';

describe('Event', () => {
  it('turns a shell command without description into a short phrase', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'gh pr list --repo foo/bar' } }] }
    });
    assertThat('tool call was not summarized', new Event(line).text(), equalTo('Bash: gh pr list --repo foo/bar'));
  });
  it('explains a shell command by its description', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'gfind . -name "*.ts"', description: 'Find TypeScript files ü' } }] }
    });
    assertThat('description was not shown', new Event(line).text(), equalTo('Find TypeScript files ü'));
  });
  it('explains a subagent by its description', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Agent', input: { prompt: 'long brief', description: 'Review the 7th PR' } }] }
    });
    assertThat('subagent was not explained', new Event(line).text(), equalTo('Review the 7th PR'));
  });
  it('explains reading of a file', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Read', input: { file_path: '/tmp/x-42/Ünï.md' } }] }
    });
    assertThat('reading was not explained', new Event(line).text(), equalTo('reading /tmp/x-42/Ünï.md'));
  });
  it('explains editing of a file', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Edit', input: { file_path: 'src/q9.js', old_string: 'a', new_string: 'b' } }] }
    });
    assertThat('editing was not explained', new Event(line).text(), equalTo('editing src/q9.js'));
  });
  it('explains writing of a file', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: 'w/zz.txt', content: 'hi' } }] }
    });
    assertThat('writing was not explained', new Event(line).text(), equalTo('writing w/zz.txt'));
  });
  it('explains searching in files', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Grep', input: { pattern: 'ba+r\\d' } }] }
    });
    assertThat('search was not explained', new Event(line).text(), equalTo('searching for "ba+r\\d"'));
  });
  it('explains looking for files', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Glob', input: { pattern: '**/*.yml' } }] }
    });
    assertThat('file search was not explained', new Event(line).text(), equalTo('looking for files "**/*.yml"'));
  });
  it('explains fetching of a page', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'WebFetch', input: { url: 'https://ex.io/a?b=1', prompt: 'p' } }] }
    });
    assertThat('fetching was not explained', new Event(line).text(), equalTo('fetching https://ex.io/a?b=1'));
  });
  it('explains searching the web', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'WebSearch', input: { query: 'node 24 ESM' } }] }
    });
    assertThat('web search was not explained', new Event(line).text(), equalTo('searching the web for "node 24 ESM"'));
  });
  it('explains using a skill', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Skill', input: { skill: 'triage-an-issue' } }] }
    });
    assertThat('skill was not explained', new Event(line).text(), equalTo('using the skill triage-an-issue'));
  });
  it('turns an unknown tool call into its name and main argument', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Zork', input: { query: 'xyzzy' } }] }
    });
    assertThat('unknown tool was not summarized', new Event(line).text(), equalTo('Zork: xyzzy'));
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
  it('summarizes the final result by its first line', () => {
    const text = `Fixed the parser ${Math.random()}`;
    const line = JSON.stringify({ type: 'result', subtype: 'success', result: `\n${text}\nDetails` });
    assertThat('result was not summarized', new Event(line).summary(), equalTo(text));
  });
  it('summarizes nothing for an assistant message', () => {
    const line = JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'Reading ü' }] } });
    assertThat('assistant message was summarized', new Event(line).summary(), equalTo(''));
  });
  it('summarizes nothing for a broken line', () => {
    assertThat('broken line was summarized', new Event('{ not json ж').summary(), equalTo(''));
  });
});
