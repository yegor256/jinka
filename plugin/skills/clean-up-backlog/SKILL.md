---
name: clean-up-backlog
description: Use this skill when a wish asks to keep the backlog of a GitHub repository in good shape.
---

# Clean Up the Backlog

<!--
@todo #2:60min Design the clean-up-backlog skill properly.
 This draft picks any issue or pull request, but it should prefer the
 oldest ones, skip those already covered by an existing wish, and
 limit how many new wishes it writes at once.
-->

List open issues with `gh issue list` and pull requests with `gh pr list`.
Pick one of them that nobody has touched for a while.
Write a new Markdown file into the wishes directory given in the prompt.
In that file, ask to triage the issue or to accept the pull request,
  naming the repository and the number.
Name the file after them, for example `foo-bar-pr-42.md`.
