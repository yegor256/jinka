// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

/**
 * One line of the stream-json output of the agent.
 * It turns the line into a short phrase that fits into one screen line,
 * such as the name of a tool with its main argument, or the first line
 * of what the agent said. Lines that carry nothing worth showing
 * become an empty phrase.
 */
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
      return [part.name, input.command ?? input.file_path ?? input.pattern ?? input.url ?? input.query ?? input.skill ?? input.description]
        .filter((p) => p !== undefined)
        .map((p) => this.#first(String(p)))
        .join(': ');
    }
    return '';
  }
  #first(text) {
    return text.split('\n').map((l) => l.trim()).find((l) => l !== '') ?? '';
  }
}
