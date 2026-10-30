// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import js from '@eslint/js';
import globals from 'globals';

const silence = {
  rules: {
    'no-comments': {
      meta: {
        type: 'suggestion',
        messages: { found: 'Comment is not allowed, except an SPDX license header' }
      },
      create(context) {
        return {
          Program() {
            context.sourceCode.getAllComments()
              .filter((comment) => comment.type !== 'Shebang' && !comment.value.trim().startsWith('SPDX-'))
              .forEach((comment) => context.report({ loc: comment.loc, messageId: 'found' }));
          }
        };
      }
    }
  }
};

export default [
  js.configs.recommended,
  {
    ignores: ['coverage/**', 'node_modules/**']
  },
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.mocha }
    },
    plugins: { silence },
    rules: {
      'silence/no-comments': 'error'
    }
  }
];
