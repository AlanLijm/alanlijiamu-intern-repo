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




## Commit Message Reflections — Milestone 3.2

3.2 Writing Meaningful Commit Messages
A vague commit message
An overly detailed commit message
A well-structured commit message.

| Style | Commit Message | Hash |
|---|---|---|
| Vague | `fix stuff` | `637caf4` |
| Overly detailed | `Updated the README file to include a new section, made some small formatting changes, also fixed a typo I noticed earlier, and added a line about commit practices while I was at it, plus I reorganized the bullet points slightly and changed the heading level from h2 to h3` | `20f8096` |
| Well-structured | `docs: add commit message practice section to README` | `1ff4bac` |
### What makes a good commit message?
A good commit message has a short, clear summary line (ideally under ~50
characters) using an imperative tone (e.g. "add", "fix", not "added" or
"fixes"), often prefixed with a type like `feat:`, `fix:`, or `docs:`.
It focuses on a single logical change, and if needed, a blank line followed
by a body explaining *why* the change was made — not just repeating *what*
changed, which is already visible in the diff.

### How does a clear commit message help in team collaboration?
It lets teammates understand the history of a project without having to
read every line of code changed. Tools like `git log` and `git blame`
become genuinely useful for tracing when and why a bug was introduced,
and reviewers can quickly judge the intent of a change during a PR review
instead of guessing.

### How can poor commit messages cause issues later?
Vague messages like "fixed stuff" make it hard to trace when a specific
bug was introduced or why a change was made, especially months later.
Overly detailed messages that bundle multiple unrelated changes into one
commit make it hard to isolate or revert a single change (e.g. with
`git revert`), and bury the actual purpose of the commit under noise.