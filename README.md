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

You may also tune it:

```bash
jinka --threads 4 --archive done/ --interval 10000 my-wishes/
```

The `--threads` option sets how many wishes are worked on at the same time
  (8 by default).
The `--archive` option names a directory where fulfilled wishes are moved,
  instead of being deleted.
The `--agent` option is the path to the agent executable
  (`claude` by default).
The `--interval` option is how many milliseconds an idle worker waits
  before it looks for new wishes again (5000 by default).
Press Ctrl-C to stop.

Be careful: `jinka` starts Claude Code with the
  `--dangerously-skip-permissions` flag,
  because an agent that runs without a human cannot answer permission prompts.
This means the agent may run any command and change any file
  your user account can reach, without asking.
Run `jinka` only in an environment where that is acceptable,
  such as a dedicated machine or a container.

That's it.
Your wish will come true.
Just sit tight and relax.
Well, provided you have Claude Code installed
  and your subscription is in good standing.
