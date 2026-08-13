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

# Milestone 3.4 — Advanced Git Commands

## 1. `git checkout main -- <file>`
Modified README.md on branch `advanced-git-practice` (appended "temporary
bad edit"). Confirmed with `git diff` that the change existed, then ran:

git checkout main -- README.md

`git status` afterward showed "nothing to commit, working tree clean" —
the file was fully restored to main's version, with no effect on any
other files in the working directory.

## 2. `git cherry-pick <commit>`
Created a new commit on `advanced-git-practice`:
`9f82045 feat: add cherry pick test file`

Switched to `main` and ran:

git cherry-pick 9f82045

Result: a new commit `852f090` was created on `main` with the same
message and file (`cherry_test.py`), but a different hash — cherry-pick
copies the change as a brand new commit rather than moving the original.

## 3. `git log`

git log --oneline --graph --all

Showed both branches diverging from a common commit, with the
cherry-picked commit appearing as two separate nodes (`852f090` on main,
`9f82045` on advanced-git-practice) — visually confirming cherry-pick
duplicates rather than merges.

## 4. `git blame README.md`

git blame README.md

Every line was attributed to the same commit (`2ce8dd7c`, Jiamu Li,
2026-08-12) — showing the file hasn't been permanently modified since
that commit, and confirming the earlier `checkout` test left no trace.

## Reflections

### What does each command do?
- `git checkout main -- <file>`: restores a single file to its version
  on another branch (here, main), without touching any other files or
  the rest of the working directory.
- `git cherry-pick <commit>`: applies the changes from one specific
  commit onto the current branch, creating a new commit with the same
  changes but a different hash — without merging the whole source branch.
- `git log`: shows the commit history, with options like `--oneline`
  for a compact view and `--graph --all` to visualize how branches
  diverge and merge.
- `git blame <file>`: shows, line by line, which commit last changed
  each line and who authored it.

### When would you use it in a real project?
- `checkout -- <file>` is useful when a specific file gets accidentally
  broken or you want to discard local edits to just one file, without
  losing other in-progress work.
- `cherry-pick` is useful when a bug fix or small feature was committed
  on a feature branch but is needed immediately on another branch (e.g.
  a hotfix) without merging unfinished work along with it.
- `log` is essential for understanding project history, tracing when a
  feature was added, and reviewing what happened before a release.
- `blame` is useful for finding out who to ask about a confusing piece
  of code, or figuring out when and why a specific line was introduced
  — especially when debugging.

### What surprised you while testing these commands?
Cherry-pick doesn't move or share the same commit hash across branches
— it creates an entirely new commit, even though the content and
message are identical. This makes sense once you think about it (each
commit's hash depends on its parent), but it wasn't obvious until seeing
`852f090` and `9f82045` side-by-side in the `--graph` output.




---

# Milestone 3.5 — Branching & Team Collaboration

## Evidence
Created a new branch `branching-practice`, committed a change to
README.md on it. Switched back to `main` and confirmed the change was
NOT present — `git log --oneline -1` on main showed the previous commit,
and README.md did not contain the "Branching Practice" section.

## Reflections

### Why is pushing directly to main problematic?
`main` is usually treated as the stable, deployable version of the
project. Pushing directly to it skips code review and any CI checks,
so untested or broken code can reach everyone immediately — including
anyone else building on top of main, or a live deployment pulling from
it. It also leaves no discussion trail explaining why a change was made.

### How do branches help with reviewing code?
Branches isolate a change from main until it's ready. This means a PR
can be opened, reviewed, and tested (e.g. via CI) without affecting
anyone else's work or the stable version of the code. Only after
approval does the change get merged in, so main always reflects
reviewed, agreed-upon work.

### What happens if two people edit the same file on different branches?
Each person's commits stay independent on their own branch and don't
interfere with each other while they're working. The conflict only
surfaces when merging: if they changed different parts of the file, git
can usually merge both automatically; if they changed the same lines,
git raises a merge conflict that has to be resolved manually by
choosing (or combining) which version to keep.

---

# Milestone 3.6 — Staging vs. Committing

## Evidence
On branch `staging-practice`, modified README.md and walked through the
full staging lifecycle:

1. `git add README.md` → `git status` showed
   `Changes to be committed` (staged, not yet committed).
2. `git restore --staged README.md` → `git status` showed
   `Changes not staged for commit` (unstaged — the edit itself was
   still present in the working directory, just removed from the
   staging area).
3. `git add README.md` again, then `git commit -m "docs: add staging
   practice section to README"` → `git status` showed
   `nothing to commit, working tree clean` (change fully committed).

## Reflections

### What is the difference between staging and committing?
Staging (`git add`) marks a change as ready to be included in the next
commit — it moves the change into a temporary "staging area" without
making it permanent. Committing (`git commit`) takes whatever is in the
staging area and writes it into the project's permanent history as a
new snapshot.

### Why does Git separate these two steps?
It gives control over exactly what goes into each commit. If multiple
files were changed for different reasons, staging lets you group only
the related ones together and commit them separately with a meaningful
message, instead of bundling every change into one commit regardless
of whether it belongs together.

### When would you want to stage changes without committing?
When you've made changes across several files but aren't ready to
commit yet — for example, wanting to review the staged diff first
(`git diff --staged`) before writing the commit message, or staging
part of your work while still editing something else that isn't ready.