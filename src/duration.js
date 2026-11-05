// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

export const duration = (millis) => {
  const minutes = () => {
    const seconds = Math.floor(millis / 1000);
    return [Math.floor(seconds / 60), seconds % 60].map((p) => String(p).padStart(2, '0')).join(':');
  };
  return Object.freeze({
    minutes,
    clock: () => {
      const total = Math.floor(millis / 60_000);
      if (total < 1000) {
        return minutes().padStart(6);
      }
      if (total < 6000) {
        return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}m`;
      }
      return `${Math.floor(total / 60)}h`.padStart(6);
    },
    phrase: () => {
      const seconds = Math.floor(millis / 1000);
      const [count, unit] = seconds < 60 ? [seconds, 'second'] : [Math.floor(seconds / 60), 'minute'];
      return `${count} ${unit}${count === 1 ? '' : 's'}`;
    },
    hours: () => {
      const seconds = Math.floor(millis / 1000);
      return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((p) => String(p).padStart(2, '0')).join(':');
    }
  });
};
