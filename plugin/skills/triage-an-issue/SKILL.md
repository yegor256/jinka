---
name: triage-an-issue
description: Use this skill when a wish asks to triage one GitHub issue.
---

# Triage an Issue

<!--
@todo #2:60min Design the triage-an-issue skill properly.
 This draft only lists the basic steps, but it should explain how to
 judge whether an issue is clear, which labels to use, and when to
 close it as a duplicate.
-->

Read the issue with `gh issue view`, including all its comments.
Decide whether it describes a real problem or a clear request.
If it does, label it and say in a comment what should be done next.
If it does not, ask its author one precise question in a comment.
