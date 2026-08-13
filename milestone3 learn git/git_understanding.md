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


# Milestone 3.3 — git bisect Practice

## Bisect Evidence
Created 5 commits on branch `bisect-practice`, introducing a bug at step 4:

| Commit | Message | Hash | Status |
|---|---|---|---|
| 1 | feat: add step 1 | `e569f92` | good |
| 2 | feat: add step 2 | `e529a78` | good |
| 3 | feat: add step 3 | `ab7d3af` | good |
| 4 | feat: add step 4 | `a818088` | **bad — bug introduced** |
| 5 | feat: add step 5 | `a60e8b7` | bad |

`git bisect` correctly identified the first bad commit:

a818088e908610d218fc0eff367e73bb7b37585e is the first bad commit
feat: add step 4

This matches the commit where `print('step 4' + 5)` was added, causing a
`TypeError: can only concatenate str (not "int") to str`.

## Reflections

### What does `git bisect` do?
It performs a binary search across a range of commits between a known
"good" state and a known "bad" state, automatically checking out the
midpoint commit at each step. By marking each tested commit as good or
bad, it narrows down the exact commit that introduced a bug in O(log n)
steps instead of checking every commit one by one.

### When would you use it in a real-world debugging situation?
When a bug is discovered but it's unclear which of many recent commits
introduced it — for example, a test suite starts failing on CI and no one
remembers exactly when it broke. Instead of guessing or reading through
dozens of commits, `git bisect` (optionally combined with `git bisect run`
and an automated test script) can pinpoint the exact commit quickly.

### How does it compare to manually reviewing commits?
Manually reviewing commits one by one is a linear search — with a long
history, that could mean checking dozens or hundreds of commits. Bisect
cuts that down logarithmically (e.g. ~100 commits takes only ~7 tests
instead of up to 100), and it removes guesswork by relying on a repeatable
test rather than reading diffs and guessing what might be the cause.