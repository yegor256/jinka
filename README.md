# Simple Command Line Orchestrator of Agents

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
npm install -g jinka
```

Finally, you run it, giving it the path to your directory with wishes:

```bash
jinka my-wishes/
```

That's it.
Your wish will come true.
Just sit tight and relax.
Well, provided you have Claude Code installed
  and your subscription is in good standing.
