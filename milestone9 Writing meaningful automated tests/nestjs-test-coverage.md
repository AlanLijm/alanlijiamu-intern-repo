# Milestone 9.10 — Understanding the Focus Bear Coverage Bar & Writing Meaningful Tests

## Reflection

**What does the coverage bar track, and why is it important?**

The coverage bar tracks how much of the code has actually been executed by the test suite, broken down into four metrics: statement coverage (how many lines/statements have been run), branch coverage (whether all the different paths of conditions like if/else have been tested), function coverage (how many functions have been called at least once), and line coverage (similar to statement coverage, counted by physical lines). It's important because it shows which parts of the codebase are actually being exercised and verified by tests, versus which parts could silently break without any test catching it. A higher coverage number generally means fewer hidden corners of the code where a bug could slip through unnoticed when the code changes — though "executed by a test" doesn't automatically mean "verified correctly," which is why coverage alone isn't the full picture.

**Why does Focus Bear enforce a minimum test coverage threshold?**

The core reason is the same as above: higher coverage means a lower risk of a code change introducing a bug that goes unnoticed. But setting a specific numeric threshold (rather than just saying "test as much as possible") makes the standard enforceable — with multiple people working on the same codebase, without a concrete, automatically-checkable minimum, the coverage standard can quietly slip in day-to-day development ("I'll skip testing this, I'm in a rush"). A hard 80% threshold lets this be checked automatically before deployment and blocks code that doesn't meet it, ensuring new functionality never ships without any test protection, and keeping the codebase's overall stability consistent over time.

**How can high test coverage still lead to untested functionality?**

Coverage tools only track whether a line of code was executed during a test run — they don't check whether the test actually verified the result was correct afterward. A line only needs to run once during a test to be marked "covered," even if the assertions checking it are extremely loose and never really validate the business logic. For example:
```ts
const result = await service.findOne(1);
expect(result).toBeDefined();
```
This line does get executed, so the coverage report shows it as covered — but the assertion only checks "is there a return value," not "is the returned cat actually correct." If `findOne`'s logic gets broken later (returning the wrong cat, or missing a field), this test would still pass, because it was never checking for that. So high coverage only proves "the code was run," not "the code behaves correctly" — real functional bugs can easily hide in places that are covered but never properly verified, only to surface after deployment.

**What are examples of weak vs. strong test assertions?**

- Checking only that something is defined, not that it's correct:
  ```ts
  // weak
  expect(result).toBeDefined();
  // strong
  expect(result).toEqual(mockCat);
  ```
- Checking only that a mock was called, not what it was called with:
  ```ts
  // weak
  expect(catsRepository.save).toHaveBeenCalled();
  // strong
  expect(catsRepository.save).toHaveBeenCalledWith(updatedCat);
  ```
  The weak version passes even if the wrong (or no) data was passed in, as long as the function was called once.
- Checking only that *some* error was thrown, not the specific error type:
  ```ts
  // weak
  await expect(service.findOne(1)).rejects.toThrow();
  // strong
  await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
  ```
  If a completely unrelated bug (e.g. a `TypeError` from accessing an undefined property) caused a different exception to be thrown instead of the intended `NotFoundException`, the weak version would still pass, masking the real problem.

**How can you balance increasing coverage with writing effective tests?**

Start from the coverage report to find files/lines that aren't covered, but don't treat every gap as equally worth closing — files with no real business logic (bootstrap code like `main.ts`, database migrations, module registration) aren't worth chasing coverage numbers for, so effort should go first into files that actually contain logic (like `cats.service.ts` and `cats.controller.ts`). For those important files, go method by method and ask two questions: is this method tested at all, and if it is, are the assertions actually strong — checking the real returned content and the exact arguments a dependency was called with — or just checking surface-level things like "no error was thrown" or "something was returned"? Coverage numbers can only tell you a line was executed, not whether the assertions checking it are rigorous, so adding new tests and reviewing existing ones for weak assertions need to happen together: adding tests closes real gaps, while reviewing existing "green" tests makes sure they're actually reliable rather than passing for the wrong reasons.

## What I did

Ran `npm run test:cov` on `cats-demo`, reviewed the coverage report, and added missing unit tests for `CatsService.create`/`findAll`/`update` and `CatsController.create`/`findAll`/`update` (the methods the report showed as untested), bringing `cats.service.ts` and `cats.controller.ts` to 100% statement/function/line coverage. Compared a deliberately weak assertion (`toBeDefined()`) against the strong assertions actually used in this project's tests (`toEqual`, `toHaveBeenCalledWith`, `rejects.toThrow(SpecificException)`) to understand why coverage percentage alone doesn't guarantee a test is meaningful.

Code: https://github.com/AlanLijm/cats-demo