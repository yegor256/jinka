---
name: accept-pull-request
description: Use this skill when a wish asks to review and accept one GitHub pull request.
---

# Accept a Pull Request

<!--
@todo #2:60min Design the accept-pull-request skill properly.
 This draft only lists the basic steps, but it should explain how deep
 the review must be, what to do with failing checks, and which merge
 method to use.
-->

Read the pull request with `gh pr view` and its diff with `gh pr diff`.
Check that all its CI checks are green with `gh pr checks`.
If the change is correct and the checks pass, merge it with `gh pr merge`.
Otherwise, explain in a review comment what has to change.
