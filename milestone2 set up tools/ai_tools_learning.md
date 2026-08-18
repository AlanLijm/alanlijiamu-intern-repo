# AI Tools Learning — Cursor

## Which tool did I use?

**Cursor** — an AI-native code editor built on top of VS Code. Installed the free plan (no subscription needed) and opened it directly on my `onboarding-backend-nest-js` repo.

## What did I use it for?

### 1. Understanding existing code
I asked Cursor to explain what the project does and its folder structure ("what does this project do? explain the folder structure"). It read through the repo and correctly identified that despite the name, `onboarding-backend-nest-js` is not an actual NestJS backend — it's Focus Bear's intern onboarding/curriculum repo, with a `duplicate-repo` script for bootstrapping a personal repo and milestone folders tracking onboarding progress. It produced a full folder tree and a milestone progression table without me having to explain any of that myself.

### 2. Debugging
I gave Cursor the same buggy NestJS `findOne` method used earlier with Claude (the `.find(user => user.id = id)` bug — assignment instead of comparison). Cursor correctly identified the bug and additionally laid out a comparison table showing expected vs actual output for several sample calls (`findOne(1)`, `findOne(2)`, `findOne(999)`), which made the impact of the bug very concrete.

## What it helped with

- **Whole-project context**: Because Cursor is opened directly on the repo (not just a single pasted snippet), it could infer the project's real purpose from the actual folder/file layout — something a plain chat assistant can't do unless you paste everything manually.
- **Debugging depth**: caught the same `=` vs `===` bug as Claude chat, but went further by tracing the exact mutation side effect and building a concrete before/after example table.

## What it struggled with

- Needed a specific starting prompt to get a genuinely useful project overview; a vague prompt would likely have gotten a shallower answer.
- Free plan usage is limited, so heavier/longer sessions would eventually need a paid plan.

## Comparison: Claude (chat) vs Cursor (IDE-integrated)

**Context**

- Claude (chat): only sees what I paste in
- Cursor: reads the whole opened project automatically

**Debugging**

- Claude (chat): explained the `=` vs `===` bug and its truthy-return cause
- Cursor: same explanation, plus a concrete input/output comparison table

**Best use case**

- Claude (chat): quick questions, concept explanations, isolated snippets
- Cursor: understanding/navigating a real codebase, in-editor fixes