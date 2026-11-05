// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { copyFile, mkdir, access } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';

export const archived = (origin, dir, archive) => {
  const target = async () => {
    const path = join(archive, origin.name());
    await mkdir(dirname(path), { recursive: true });
    return access(path).then(
      () => `${path.slice(0, path.length - extname(path).length)}-${Date.now()}${extname(path)}`,
      () => path
    );
  };
  return Object.freeze({
    name: () => origin.name(),
    text: async () => origin.text(),
    fate: () => origin.fate(),
    close: async () => {
      await access(join(dir, origin.name())).then(
        async () => copyFile(join(dir, origin.name()), await target()),
        () => {}
      );
      await origin.close();
    },
    free: () => origin.free()
  });
};
