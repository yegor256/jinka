// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const event = (line, count) => {
  const first = (text) => text.split('\n').map((l) => l.trim()).find((l) => l !== '') ?? '';
  const program = (command) => `\x1b[38;2;0;204;204m${command.trim().split(/\s+/)[0].split('/').at(-1)}\x1b[39m (${count} lines)`;
  const plain = (name, input) => {
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
  };
  const part = (piece) => {
    if (piece.type === 'text') {
      return first(piece.text);
    }
    if (piece.type === 'tool_use') {
      const input = piece.input ?? {};
      const phrase = plain(piece.name, input);
      if (phrase !== undefined) {
        return first(phrase);
      }
      if (piece.name === 'Bash' && input.command !== undefined) {
        return program(String(input.command));
      }
      return `\x1b[38;2;0;204;204m${
        [piece.name, input.command ?? input.file_path ?? input.pattern ?? input.url ?? input.query ?? input.skill ?? input.description]
          .filter((p) => p !== undefined)
          .map((p) => first(String(p)))
          .join(': ')
      }\x1b[39m`;
    }
    return '';
  };
  const final = (json) => {
    if (json.type === 'result') {
      return String(json.result ?? '');
    }
    if (json.type === 'item.completed' && json.item?.type === 'agent_message') {
      return String(json.item.text ?? '');
    }
    return '';
  };
  const phrase = (json) => {
    if (json.type === 'assistant') {
      return (json.message?.content ?? []).map((p) => part(p)).filter((p) => p !== '').join(' ');
    }
    if (json.type === 'result') {
      return first(String(json.result ?? json.subtype ?? ''));
    }
    if (json.type === 'item.completed' && json.item?.type === 'agent_message') {
      return first(String(json.item.text ?? ''));
    }
    if (json.type === 'item.started' && json.item?.type === 'command_execution') {
      return program(String(json.item.command ?? ''));
    }
    if (json.type === 'item.completed' && json.item?.type === 'file_change') {
      return `editing ${(json.item.changes ?? []).map((c) => c.path).join(', ')}`;
    }
    if (json.type === 'turn.failed') {
      return first(String(json.error?.message ?? ''));
    }
    return '';
  };
  return Object.freeze({
    text: () => {
      try {
        return phrase(JSON.parse(line));
      } catch {
        return line.trim();
      }
    },
    summary: () => {
      try {
        return first(final(JSON.parse(line)));
      } catch {
        return '';
      }
    },
    link: () => {
      try {
        return (final(JSON.parse(line)).match(/https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/(?:issues|pull)\/\d+/) ?? [''])[0];
      } catch {
        return '';
      }
    }
  });
};
