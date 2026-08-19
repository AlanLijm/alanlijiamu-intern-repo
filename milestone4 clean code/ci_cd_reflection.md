# Static Analysis Checks in CI/CD

## 📖 Research: What is CI/CD and Why It's Used

- **Continuous Integration (CI)**: automatically building, testing, and checking code every time someone pushes or opens a pull request, instead of manually running checks locally and hoping nothing was missed. The goal is to catch problems (broken builds, failing tests, style violations) as early and as automatically as possible, before they reach the main branch.
- **Continuous Deployment/Delivery (CD)**: automatically shipping code that passes CI checks toward staging or production, reducing manual release steps and the risk of human error during deployment.
- **Why it matters**: without CI, "does this pass lint/tests" depends on each individual developer remembering to run checks locally before pushing — which is inconsistent and easy to skip under time pressure. CI makes the check mandatory and visible to everyone (e.g. as a required status check on a PR), rather than optional and invisible.
- **Static analysis in CI specifically**: tools like ESLint (4.10), markdown linters, and spell checkers can all run automatically on every PR. This extends the same "catch issues before a human reviewer looks" principle from 4.10 to the team/repo level — a PR with lint errors can be blocked from merging until fixed, rather than relying on a reviewer to notice.
- **Shift-left testing**: catching an issue in CI (minutes after a push) is far cheaper to fix than catching it after merge, after deployment, or after a user reports it — the earlier a problem is caught in the pipeline, the cheaper it is to resolve.

## 🛠 Setting Up CI: Markdown Lint + Spell Check on PRs

**GitHub Actions workflow** (`.github/workflows/lint-docs.yml`):
```yaml
name: Lint Documentation

on:
  pull_request:
    paths:
      - '**/*.md'

jobs:
  markdown-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run markdownlint
        uses: DavidAnson/markdownlint-cli2-action@v16
        with:
          globs: '**/*.md'

  spell-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install cspell
        run: npm install -g cspell
      - name: Run spell check
        run: cspell "**/*.md" --no-progress
```

This runs two separate jobs whenever a PR touches any `.md` file: `markdownlint` for formatting/style rules (consistent heading levels, no trailing whitespace, etc.) and `cspell` for spelling. Both show up as PR status checks — a reviewer sees pass/fail directly on the PR without running anything locally.

**`.markdownlint.json`** (repo root — customizes which markdown rules apply):
```json
{
  "default": true,
  "MD013": false,
  "MD033": false,
  "MD025": false
}
```
(`MD013` — line length — and `MD033` — inline HTML — are disabled here since the milestone docs use long explanatory lines and occasional HTML for formatting; every other default rule stays on.)

**`cspell.json`** (repo root — custom dictionary for project-specific terms):
```json
{
  "version": "0.2",
  "language": "en",
  "words": [
  "NestJS",
  "onboarding",
  "eslint",
  "prettier",
  "typescript",
  "milestone",
  "airbnb",
  "guard",
  "refactor",
  "unindent",
  "stringly",
  "Validatable",
  "bikeshedding",
  "oneline",
  "alanlijiamu",
  "behaviour",
  "behavioural",
  "Bitwarden",
  "anonymised",
  "organisational",
  "minimise",
  "autoplay",
  "colours",
  "colour",
  "customisable",
  "reprioritize",
  "reprioritizes",
  "neurotypical",
  "Tiimo",
  "Routinery",
  "focusbear",
  "blocklist",
  "Pomodoro",
  "Jiamu"
  ],
  "ignorePaths": ["node_modules/**"]
}
```

## 🪝 Git Hooks with Husky (Pre-Commit Linting)

Husky runs checks locally *before* a commit is even created, catching issues before they ever reach CI — a faster feedback loop than waiting for the PR pipeline.

**Install:**
```powershell
npm install --save-dev husky lint-staged
npx husky init
```

**`.husky/pre-commit`:**
```bash
npx lint-staged
```

**`package.json` addition:**
```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix"],
    "*.md": ["markdownlint-cli2 --fix"]
  }
}
```
`lint-staged` runs the linter only on the files staged for commit (not the whole repo), so pre-commit checks stay fast even as the project grows. If a file fails lint and can't be auto-fixed, the commit is blocked until it's resolved.

## 🔁 CI vs Git Hooks — How They Fit Together
- **Git hooks (Husky)**: fast, local, catches issues before a commit is even made — but can be bypassed (`git commit --no-verify`) or skipped if someone hasn't installed the hooks (e.g. a fresh clone before `npm install` runs).
- **CI (GitHub Actions)**: slower (runs after push, not before commit) but authoritative — it runs in a clean environment for everyone, can't be bypassed by an individual's local setup, and is what actually gates merging via required status checks.
- Using both together means most problems are caught immediately and locally (fast feedback), while CI acts as the non-negotiable safety net that guarantees nothing broken reaches `main`.

## 🧪 Test PR (Actual Run)
Opened a real PR (`#82`, `test-ci-lint` → `main`) that intentionally introduced a skipped heading level and a misspelled word in a new file (`ci-test.md`) to trigger the workflow. Both `markdown-lint` and `spell-check` failed immediately, confirming the workflow triggers correctly on PRs.

Fixing that PR to a green state turned into a much larger, more realistic exercise than expected — 23 commits over the course of the PR. `cspell` initially reported 44 spelling issues across 17 files (not just the intentionally-broken test file), because it scanned the whole repo rather than just the changed files. Most were false positives: legitimate technical terms (`NestJS`, `Validatable`), British spellings (`behaviour`, `organisational`, `colour`), product/brand names (`Tiimo`, `Routinery`, `Bitwarden`), and one genuine typo (`Principl` → `Principles`) that needed an actual fix rather than a dictionary addition. `markdownlint` surfaced an even wider spread of pre-existing issues across older milestone docs — inconsistent list markers (MD004), incorrect list indentation (MD007), hard tabs used for what were really tables (MD010), multiple top-level headings in a document that intentionally aggregates several milestones (MD025), trailing whitespace (MD009), multiple blank lines (MD012), emphasis used instead of real headings (MD036), fenced code blocks missing a language tag, and a setext-style heading accidentally created because a code fence was missing its opening backticks (which caused the code inside to be parsed as markdown instead of as a code block — a good reminder that one small formatting slip can cascade into several unrelated-looking lint errors).

Each issue got one of three treatments: (1) fixed at the source when it was a real formatting problem (rewriting tab-separated pseudo-tables into proper markdown tables, trimming trailing whitespace, fixing the missing code fence), (2) added to `cspell.json`'s custom dictionary when it was a legitimate term being flagged as unknown, or (3) disabled in `.markdownlint.json` when the rule conflicted with an intentional structural choice (e.g. `MD025` for `clean_code.md`, which deliberately uses multiple `#`-level headings to separate milestone sections). All checks passed after these fixes, and the PR was merged.

## 💭 Reflections

**What is the purpose of CI/CD?**
CI/CD automates the steps that verify and ship code — building, running tests, linting, and (for CD) deploying — so that these checks happen consistently on every change instead of depending on each developer remembering to run them manually. The core purpose is to catch problems as early as possible, ideally before code merges into the main branch, so that the codebase's shared baseline stays reliable for everyone working from it.

**How does automating style checks improve project quality?**
It removes reliance on human memory and diligence for something that's cheap to automate — instead of a reviewer having to notice a spelling mistake or an inconsistent markdown heading, the check runs automatically and reports pass/fail directly on the PR. This connects directly to 4.10: just as ESLint/Prettier catch code style issues locally, CI extends the same idea to every contributor's PR, so style consistency doesn't depend on any one person's setup or attention to detail. It also documents the team's standard in a config file (`.markdownlint.json`, `cspell.json`) rather than in someone's head — and forces those standards to be made explicit, since every rule that gets disabled has to be a deliberate, justified decision rather than something left ambiguous.

**What are some challenges with enforcing checks in CI/CD?**
The single biggest challenge, confirmed directly in this test PR, is what happens when you introduce CI checks into an *existing* codebase rather than a brand-new one: the first run doesn't just check your new change, it can surface a long tail of pre-existing issues that were never a problem before because nothing was checking for them. In this case, a PR that intentionally changed one small test file ended up needing 23 commits and touching a dozen-plus historical files before all checks passed, because `cspell` and `markdownlint` both scanned the whole repository by default. This creates a real trade-off: fixing every historical issue is thorough but can turn a small PR into a large, slow one; disabling rules is fast but risks silently lowering the bar; and scoping checks to only the files changed in a PR (which I considered but ultimately didn't need once the historical issues were resolved) avoids the problem going forward but means old files never get checked unless someone happens to touch them again. False positives are also a real cost on top of this — legitimate technical terms, brand names, and intentional structural choices (like a document with multiple top-level headings by design) all get flagged the same way as genuine mistakes, and distinguishing them takes judgment, not just running the tool.

**How do CI/CD pipelines differ between small projects and large teams?**
A small project or solo repo (like this onboarding one) can get away with a simple pipeline — a couple of GitHub Actions jobs and a Husky pre-commit hook — since there's little coordination overhead and fast iteration matters most, even if (as I found) rolling out lint rules against existing content still takes real work the first time. A large team's pipeline typically needs to handle much more: parallelized test suites to keep CI fast despite a bigger codebase, staged environments (dev/staging/prod) with separate CD gates, required reviewer approvals combined with required status checks, security/dependency scanning, and often separate pipelines per service in a microservices setup. Large teams also tend to introduce new lint rules more cautiously than I did here — often warning-only at first, or scoped to new files only from day one — specifically to avoid the kind of large, disruptive first-PR cleanup this exercise involved, since blocking dozens of engineers' PRs on a sudden wave of historical violations would be far more costly than it was for a single practice repo.