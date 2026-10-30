# Simple Command Line Orchestrator of Agents

[![test](https://github.com/yegor256/jinka/actions/workflows/test.yml/badge.svg)](https://github.com/yegor256/jinka/actions/workflows/test.yml)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/yegor256/jinka/blob/master/LICENSE.txt)

First, you create a directory with your wishes, one per Markdown file.
You can start with a single wish:

```text
my-wishes/
  make-me-happy.md
```

In the `make-me-happy.md` file you say something like this:

```text
I wish my GitHub repositories were in good shape: `foo/bar` and `foo/bar2`.
```

Then, you install `jinka`:

```bash
npm install -g @yegor256/jinka
```

Finally, you run it, giving it the path to your directory with wishes:

```bash
jinka my-wishes/
```

That's it.
Your wish will come true.
