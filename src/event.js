// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { styleText } from 'node:util';

export class Event {
  constructor(line) {
    this.line = line;
  }
  text() {
    try {
      return this.#phrase(JSON.parse(this.line));
    } catch {
      return this.line.trim();
    }
  }
  summary() {
    try {
      const json = JSON.parse(this.line);
      return json.type === 'result' ? this.#first(String(json.result ?? '')) : '';
    } catch {
      return '';
    }
  }
  link() {
    try {
      const json = JSON.parse(this.line);
      return json.type === 'result' ? (String(json.result ?? '').match(/https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/(?:issues|pull)\/\d+/) ?? [''])[0] : '';
    } catch {
      return '';
    }
  }
  #phrase(json) {
    if (json.type === 'assistant') {
      return (json.message?.content ?? []).map((part) => this.#part(part)).filter((p) => p !== '').join(' ');
    }
    if (json.type === 'result') {
      return this.#first(String(json.result ?? json.subtype ?? ''));
    }
    return '';
  }
  #part(part) {
    if (part.type === 'text') {
      return this.#first(part.text);
    }
    if (part.type === 'tool_use') {
      const input = part.input ?? {};
      const phrase = this.#plain(part.name, input);
      if (phrase !== undefined) {
        return this.#first(phrase);
      }
      return styleText(
        'gray',
        [part.name, input.command ?? input.file_path ?? input.pattern ?? input.url ?? input.query ?? input.skill ?? input.description]
          .filter((p) => p !== undefined)
          .map((p) => this.#first(String(p)))
          .join(': '),
        { validateStream: false }
      );
    }
    return '';
  }
  #plain(name, input) {
    const phrases = {
      Bash: () => input.description,
      Agent: () => input.description,
      Task: () => input.description,
      Read: () => input.file_path && `reading ${input.file_path}`,
      Edit: () => input.file_path && `editing ${input.file_path}`,
      MultiEdit: () => input.file_path && `editing ${input.file_path}`,
      Write: () => input.file_path && `writing ${input.file_path}`,
      Grep: () => input.pattern && `searching for "${input.pattern}"`,
      Glob: () => input.pattern && `looking for files "${input.pattern}"`,
      WebFetch: () => input.url && `fetching ${input.url}`,
      WebSearch: () => input.query && `searching the web for "${input.query}"`,
      Skill: () => input.skill && `using the skill ${input.skill}`
    };
    return Object.hasOwn(phrases, name) ? phrases[name]() || undefined : undefined;
  }
  #first(text) {
    return text.split('\n').map((l) => l.trim()).find((l) => l !== '') ?? '';
  }
}
