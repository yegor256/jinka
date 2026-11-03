// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export class Event {
  constructor(line, count) {
    this.line = line;
    this.count = count;
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
      return this.#first(this.#final(JSON.parse(this.line)));
    } catch {
      return '';
    }
  }
  link() {
    try {
      return (this.#final(JSON.parse(this.line)).match(/https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/(?:issues|pull)\/\d+/) ?? [''])[0];
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
    if (json.type === 'item.completed' && json.item?.type === 'agent_message') {
      return this.#first(String(json.item.text ?? ''));
    }
    if (json.type === 'item.started' && json.item?.type === 'command_execution') {
      return this.#program(String(json.item.command ?? ''));
    }
    if (json.type === 'item.completed' && json.item?.type === 'file_change') {
      return `editing ${(json.item.changes ?? []).map((c) => c.path).join(', ')}`;
    }
    if (json.type === 'turn.failed') {
      return this.#first(String(json.error?.message ?? ''));
    }
    return '';
  }
  #final(json) {
    if (json.type === 'result') {
      return String(json.result ?? '');
    }
    if (json.type === 'item.completed' && json.item?.type === 'agent_message') {
      return String(json.item.text ?? '');
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
      if (part.name === 'Bash' && input.command !== undefined) {
        return this.#program(String(input.command));
      }
      return `\x1b[38;2;0;204;204m${
        [part.name, input.command ?? input.file_path ?? input.pattern ?? input.url ?? input.query ?? input.skill ?? input.description]
          .filter((p) => p !== undefined)
          .map((p) => this.#first(String(p)))
          .join(': ')
      }\x1b[39m`;
    }
    return '';
  }
  #program(command) {
    return `\x1b[38;2;0;204;204m${command.trim().split(/\s+/)[0].split('/').at(-1)}\x1b[39m (${this.count} lines)`;
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
