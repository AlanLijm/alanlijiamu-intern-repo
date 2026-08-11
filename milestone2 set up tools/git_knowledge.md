# Git Knowledge

## Have I used Git before?

Yes. I've been using Git throughout this onboarding process — committing and pushing each milestone reflection via the command line (PowerShell). I also completed a dedicated merge conflict exercise earlier (creating a conflict in `Agile-Principles.md` between `main` and a `conflict-test` branch, then resolving it), which is documented in `git_understanding.md`.

## Which Git client did I choose? Why?

I use **the command line (PowerShell)** as my primary way of working with Git — `git status`, `git add`, `git commit`, `git push` — since that's what I've been doing throughout onboarding and it helps me understand what's actually happening under the hood.

I also installed **GitHub Desktop** to try a GUI client. I connected it to my repo (`alanlijiamu-intern-repo`) and used the History tab to browse past commits visually — each commit shows a clear diff (added/changed lines highlighted), which made it much easier to review what changed in a commit (e.g. the Agile-Principles.md reflection, or the earlier merge conflict resolution) compared to scrolling through `git log` and `git diff` output in the terminal.

## What was the most interesting thing I learned about Git today?

Seeing my commit history in GitHub Desktop's History view made the value of **descriptive commit messages** very clear — messages like "resolve merge conflict in Agile-Principl..." and "conflicting add on main" instantly tell the story of what happened, without needing to open each diff. It reinforced that the GUI and CLI are just two views of the same underlying Git data — nothing is different about the repo itself, only how easy it is to inspect.