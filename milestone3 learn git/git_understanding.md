## PR Reflections — Milestone 3.1

### Why are PRs important in a team workflow?
PRs make code changes visible and reviewable before they're merged into main.
They expose not just the final result, but the whole process — commit history,
line-by-line review comments, and discussion threads. This means:
- Bugs and style issues get caught before they reach production, not after.
- Knowledge is shared across the team — even people who didn't write the code
  can see what changed and why.
- There's a traceable record of decisions: if something breaks later, you can
  look back at the PR to see what was discussed and why a change was made
  the way it was.

### What makes a well-structured PR?
- A clear, descriptive title and a description that explains *what* changed
  and *why* (not just *what*).
- Linked to a related issue where relevant, so context isn't lost.
- Small, focused scope — easier for a reviewer to actually read and understand
  than one giant PR touching many unrelated things.
- Passing CI checks / tests included where applicable.

### What did you learn from reviewing an open-source PR?
Reviewing a PR on React showed how review comments are often specific and
line-level rather than general feedback — reviewers point to exact lines and
explain the reasoning, and authors either push a follow-up commit addressing
it or explain their reasoning back. It also showed that merging usually
requires at least one approval plus passing CI checks, not just a quick glance.


3.2 Writing Meaningful Commit Messages
A vague commit message

An overly detailed commit message

A well-structured commit message.