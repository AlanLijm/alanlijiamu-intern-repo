# 0.10 Agile Workflows & Kanban

Research & Learn
How does a Kanban board work, and how does it help manage workflow?

A Kanban board visualizes work as cards moving left to right across columns representing stages of a process. Anyone looking at the board can immediately see what's being worked on, what's waiting, and what's finished — without needing a status meeting. This visibility is the core mechanism: it turns invisible, in-progress work into something the whole team can see and reason about together.

What do the different columns on a Kanban board represent?

Typical columns (exact names vary by team):

| Column | Meaning |
|---|---|
| Backlog | Work that's identified but not yet started or prioritized |
| To Do / Ready | Prioritized and ready to be picked up next |
| In Progress | Actively being worked on |
| Blocked | Started, but stuck waiting on something (a decision, a dependency, a review from someone else) |
| In Review / Ready for Review | Work is done and waiting for someone else to check it (e.g. code review, PR review) |
| Done | Completed and meets the definition of done |

A Blocked column (or a "blocked" label) matters because it makes stuck work visible immediately, instead of it silently sitting in "In Progress" while nothing actually happens.

How do tasks move through the board, and who is responsible for updating them?

Tasks move through columns as their state changes — typically left to right, though they can move backward (e.g. a reviewer sends something back from "In Review" to "In Progress" if changes are needed). In most Agile teams, the person doing the work is responsible for updating the card's status themselves, in real time, as their own work changes state — not a manager updating it on their behalf. This is part of why Kanban reduces the need for status meetings: the board is the status update.

What are the benefits of limiting work in progress (WIP)?
Exposes bottlenecks: if a column hits its WIP limit, that's a visible signal something downstream (e.g. reviewers) is the constraint, not a mystery to be discovered later.
Encourages finishing over starting: a capped WIP limit forces the team to finish current tasks before pulling in new ones, reducing half-finished work piling up.
Reduces context-switching: fewer things "in flight" per person means less mental overhead jumping between tasks.
Improves flow and predictability: work moves through the system faster and more consistently when it isn't competing with too many other in-progress items.

 Reflection

How does Kanban help manage priorities and avoid overload?

Kanban helps manage priorities by making the status of every task visible on one board, so the team can immediately see what's blocked, what's in progress, and what's waiting in the backlog without needing a separate status meeting. Limiting work in progress (WIP) prevents overload by forcing the team — and each individual — to finish or unblock existing tasks before pulling in new ones, rather than starting many things at once and letting them pile up half-done.

How can you improve your workflow using Kanban principles?

I can set a personal WIP limit for myself to avoid taking on too many tasks in progress at the same time. For example, if I work on three or more onboarding issues simultaneously, it will cost me too much time and focus jumping from one issue to another, instead of finishing each one properly before moving to the next.

Task
 Create a Kanban board for your repo with relevant columns (e.g. Not Started, In Progress, Ready for Review, Approved by Bot).
 Move at least one task through the Kanban process and update its status correctly.
 Identify one way you can improve task tracking in your role.

Kanban board setup: I set up a board for the onboarding repo with the following columns: Not Started, In Progress, Ready for Review, and Approved. Out of the 79 onboarding issues, issues #1, #4, #5, #6, and #10 are currently in the In Progress column; issues #2, #3, #7, #8, and #9 have already been reviewed and moved to Approved; the remaining 69 issues sit in Not Started; and Ready for Review is currently empty since I haven't finished any in-progress issue yet.
![Kanban board screenshot](kanban_screenshot.png)

Task moved through the board:
Issues #2, #3, #7, #8, and #9 started in Not Started, moved to In Progress while I worked on them, then to Read for Review once I completed them and marked them ready, and finally to Approved after review confirmed they met the requirements.
![Kanban board screenshot changed status](kanban_screenshot_newStatus.png)

By contrast, issues #1, #4, #5, #6, and #10 are still sitting in In Progress, which reflects exactly the overload problem I identified in my reflection — too many tasks started at once without a WIP limit.

One way I can improve task tracking:
Since I currently have five issues sitting In Progress at once, I should apply a personal WIP limit (e.g. no more than 2 issues in progress at a time) so that issues move fully through to Approved before I start new ones, instead of having several open in parallel with none reaching Ready for Review.
