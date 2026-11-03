// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { stripVTControlCharacters } from 'node:util';
import { assertThat, equalTo } from 'hamjest';
import { Event } from '../src/event.js';

describe('Event', () => {
  it('names the program of a shell command without description', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'gh pr list --repo foo/bar' } }] }
    });
    assertThat('program was not named', stripVTControlCharacters(new Event(line, 7).text()), equalTo('gh (7 lines)'));
  });
  it('paints a shell command without description in cyan', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'git log --oneline | head -7' } }] }
    });
    assertThat('shell command was not cyan', new Event(line, 7).text(), equalTo('\x1b[38;2;0;204;204mgit\x1b[39m (7 lines)'));
  });
  it('shows the length of the agent log next to the program of a shell command', () => {
    const count = 1 + Math.floor(Math.random() * 10000);
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'cd /tmp/ж && ls' } }] }
    });
    assertThat('length of the log was not shown', stripVTControlCharacters(new Event(line, count).text()), equalTo(`cd (${count} lines)`));
  });
  it('names the program of a shell command without its directory', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: '  /usr/local/bin/rg -n "ü" src' } }] }
    });
    assertThat('directory was not dropped', stripVTControlCharacters(new Event(line, 7).text()), equalTo('rg (7 lines)'));
  });
  it('explains a shell command by its description', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'gfind . -name "*.ts"', description: 'Find TypeScript files ü' } }] }
    });
    assertThat('description was not shown', new Event(line, 7).text(), equalTo('Find TypeScript files ü'));
  });
  it('explains a subagent by its description', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Agent', input: { prompt: 'long brief', description: 'Review the 7th PR' } }] }
    });
    assertThat('subagent was not explained', new Event(line, 7).text(), equalTo('Review the 7th PR'));
  });
  it('explains reading of a file', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Read', input: { file_path: '/tmp/x-42/Ünï.md' } }] }
    });
    assertThat('reading was not explained', new Event(line, 7).text(), equalTo('reading /tmp/x-42/Ünï.md'));
  });
  it('explains editing of a file', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Edit', input: { file_path: 'src/q9.js', old_string: 'a', new_string: 'b' } }] }
    });
    assertThat('editing was not explained', new Event(line, 7).text(), equalTo('editing src/q9.js'));
  });
  it('explains writing of a file', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: 'w/zz.txt', content: 'hi' } }] }
    });
    assertThat('writing was not explained', new Event(line, 7).text(), equalTo('writing w/zz.txt'));
  });
  it('explains searching in files', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Grep', input: { pattern: 'ba+r\\d' } }] }
    });
    assertThat('search was not explained', new Event(line, 7).text(), equalTo('searching for "ba+r\\d"'));
  });
  it('explains looking for files', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Glob', input: { pattern: '**/*.yml' } }] }
    });
    assertThat('file search was not explained', new Event(line, 7).text(), equalTo('looking for files "**/*.yml"'));
  });
  it('explains fetching of a page', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'WebFetch', input: { url: 'https://ex.io/a?b=1', prompt: 'p' } }] }
    });
    assertThat('fetching was not explained', new Event(line, 7).text(), equalTo('fetching https://ex.io/a?b=1'));
  });
  it('explains searching the web', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'WebSearch', input: { query: 'node 24 ESM' } }] }
    });
    assertThat('web search was not explained', new Event(line, 7).text(), equalTo('searching the web for "node 24 ESM"'));
  });
  it('explains using a skill', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Skill', input: { skill: 'triage-an-issue' } }] }
    });
    assertThat('skill was not explained', new Event(line, 7).text(), equalTo('using the skill triage-an-issue'));
  });
  it('turns an unknown tool call into its name and main argument', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'Zork', input: { query: 'xyzzy' } }] }
    });
    assertThat('unknown tool was not summarized', stripVTControlCharacters(new Event(line, 7).text()), equalTo('Zork: xyzzy'));
  });
  it('keeps only the first line of the agent text', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'text', text: '\nReading the issue body\nand more' }] }
    });
    assertThat('first line was not kept', new Event(line, 7).text(), equalTo('Reading the issue body'));
  });
  it('names a tool without input by its name', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: { content: [{ type: 'tool_use', name: 'TodoWrite', input: {} }] }
    });
    assertThat('tool name was not shown', stripVTControlCharacters(new Event(line, 7).text()), equalTo('TodoWrite'));
  });
  it('stays silent on tool results', () => {
    const line = JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result' }] } });
    assertThat('tool result was not ignored', new Event(line, 7).text(), equalTo(''));
  });
  it('reports the final result', () => {
    const line = JSON.stringify({ type: 'result', subtype: 'success', result: 'Merged two PRs\nDetails' });
    assertThat('result was not reported', new Event(line, 7).text(), equalTo('Merged two PRs'));
  });
  it('shows a line that is not json as it is', () => {
    assertThat('plain line was lost', new Event('  plain words  ', 3).text(), equalTo('plain words'));
  });
  it('summarizes the final result by its first line', () => {
    const text = `Fixed the parser ${Math.random()}`;
    const line = JSON.stringify({ type: 'result', subtype: 'success', result: `\n${text}\nDetails` });
    assertThat('result was not summarized', new Event(line, 7).summary(), equalTo(text));
  });
  it('summarizes nothing for an assistant message', () => {
    const line = JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'Reading ü' }] } });
    assertThat('assistant message was summarized', new Event(line, 7).summary(), equalTo(''));
  });
  it('summarizes nothing for a broken line', () => {
    assertThat('broken line was summarized', new Event('{ not json ж', 3).summary(), equalTo(''));
  });
  it('finds the link to the pull request in the final result', () => {
    const url = `https://github.com/z-${Math.floor(Math.random() * 1000)}/ü-x/pull/${Math.floor(Math.random() * 1000)}`;
    const line = JSON.stringify({ type: 'result', subtype: 'success', result: `Merged it\n${url}\n` });
    assertThat('link was not found', new Event(line, 7).link(), equalTo(url));
  });
  it('finds no link in a final result without a url', () => {
    const line = JSON.stringify({ type: 'result', subtype: 'success', result: 'Did nothing ж\nhttps://example.com/a/b/pull/7' });
    assertThat('link was found where none was', new Event(line, 7).link(), equalTo(''));
  });
  it('finds no link in an assistant message', () => {
    const line = JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'see https://github.com/a/b/issues/3' }] } });
    assertThat('link was found in an assistant message', new Event(line, 7).link(), equalTo(''));
  });
  it('reports a message of codex by its first line', () => {
    const line = JSON.stringify({ type: 'item.completed', item: { id: 'item_3', type: 'agent_message', text: '\nLooking at the tests ü\nmore' } });
    assertThat('codex message was not reported', new Event(line, 7).text(), equalTo('Looking at the tests ü'));
  });
  it('paints the program of a codex shell command in cyan', () => {
    const line = JSON.stringify({ type: 'item.started', item: { id: 'item_1', type: 'command_execution', command: 'git status --short', status: 'in_progress' } });
    assertThat('codex command was not cyan', new Event(line, 7).text(), equalTo('\x1b[38;2;0;204;204mgit\x1b[39m (7 lines)'));
  });
  it('stays silent when a shell command of codex completes', () => {
    const line = JSON.stringify({ type: 'item.completed', item: { id: 'item_1', type: 'command_execution', command: 'ls', aggregated_output: 'a.md', status: 'completed' } });
    assertThat('completed codex command was not ignored', new Event(line, 7).text(), equalTo(''));
  });
  it('explains a file change of codex', () => {
    const line = JSON.stringify({ type: 'item.completed', item: { id: 'item_2', type: 'file_change', changes: [{ path: '/src/ж.js', kind: 'update' }], status: 'completed' } });
    assertThat('codex file change was not explained', new Event(line, 7).text(), equalTo('editing /src/ж.js'));
  });
  it('reports a failed turn of codex', () => {
    const line = JSON.stringify({ type: 'turn.failed', error: { message: 'Quota is over ü\nRetry later' } });
    assertThat('codex failure was not reported', new Event(line, 7).text(), equalTo('Quota is over ü'));
  });
  it('summarizes a message of codex by its first line', () => {
    const text = `Closed the issue ${Math.random()}`;
    const line = JSON.stringify({ type: 'item.completed', item: { id: 'item_9', type: 'agent_message', text: `${text}\nhttps://github.com/a/b/issues/3` } });
    assertThat('codex message was not summarized', new Event(line, 7).summary(), equalTo(text));
  });
  it('finds the link to the issue in a message of codex', () => {
    const url = `https://github.com/q-${Math.floor(Math.random() * 1000)}/ж/issues/${Math.floor(Math.random() * 1000)}`;
    const line = JSON.stringify({ type: 'item.completed', item: { id: 'item_9', type: 'agent_message', text: `Closed it\n${url}` } });
    assertThat('link was not found in a codex message', new Event(line, 7).link(), equalTo(url));
  });
});
