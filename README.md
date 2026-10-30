# Simple Command Line Orchestrator of Agents

[![test](https://github.com/yegor256/jinka/actions/workflows/test.yml/badge.svg)](https://github.com/yegor256/jinka/actions/workflows/test.yml)
[![npm](https://img.shields.io/npm/v/@yegor256/jinka)](https://www.npmjs.com/package/@yegor256/jinka)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/yegor256/jinka/blob/master/LICENSE.txt)

First, you create `~/.jinka/wishes/Make-Me-Happy.md` file:

```text
I wish my GitHub repositories were in good shape: `foo/bar` and `foo/bar2`.
```

Then, you install `jinka`:

```bash
npm install -g @yegor256/jinka
```

Finally, you run it, giving it the path to your directory with wishes:

```bash
jinka
```

That's it.
Your wish will come true.
