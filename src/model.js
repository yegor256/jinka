// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const model = () => {
  const names = [];
  return Object.freeze({
    add: (line) => {
      try {
        const json = JSON.parse(line);
        if (json.type === 'system' && json.subtype === 'init' && typeof json.model === 'string') {
          names.push(json.model);
        }
      } catch {
        return;
      }
    },
    text: () => {
      const parts = (names.at(-1) ?? '').replace(/^claude-/, '').replace(/-\d{8}$/, '').split('-').filter((p) => p !== '');
      return [
        ...parts.filter((p) => !/^\d+$/.test(p)).map((p) => `${p[0].toUpperCase()}${p.slice(1)}`),
        parts.filter((p) => /^\d+$/.test(p)).join('.')
      ].join('');
    }
  });
};
