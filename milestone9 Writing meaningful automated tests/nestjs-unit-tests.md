# Milestone 9.6 — Writing Unit Tests for Services & Controllers in NestJS

## Reflection

**Why is it important to test services separately from controllers?**

Controllers and services play different roles: services are responsible for business logic (for example, the "return the entity or throw NotFoundException" decision in `CatsService.findOne`), while controllers are only responsible for receiving requests, calling the service, and returning the result to the client — they shouldn't contain business logic themselves. Testing them separately means service tests can focus purely on whether the logic itself is correct (we tested both branches: returning the cat when found, and throwing `NotFoundException` when not found) without worrying about how the HTTP request got there. Controller tests, on the other hand, mock the whole service and only check that the controller calls the service correctly, passes the right arguments, and returns the result unchanged. If the two were tested together, a failing test wouldn't tell you whether the bug is in the business logic or in the request handling, making it much harder to pinpoint the problem.

**How does mocking dependencies improve unit testing?**

Mocking dependencies has several benefits: it avoids connecting to a real database or external service, so tests run faster; it gives full freedom over what a dependency returns, without being limited by real data formats or the current state of a database — for example, we could make `findOneBy` return `null` directly to simulate "record not found," instead of actually deleting data from a real database to create that scenario; it makes results more reliable and repeatable, since a real database can be affected by network issues, concurrency, or dirty data, causing the same test to pass or fail inconsistently, whereas a mock's behaviour is fully controlled by us and stays consistent every run; and it keeps the test scope limited to the unit under test — a service test shouldn't fail because the database is unreachable, since that's the responsibility of the database/repository layer, not the service's own logic.

**What are common pitfalls when writing unit tests in NestJS?**

- Dependencies not properly mocked, causing dependency-injection errors. `Test.createTestingModule()` actually performs real dependency resolution, so if a service/controller's dependency (a TypeORM repository, a BullMQ queue, another service) isn't provided in `providers`, Nest throws a "can't resolve dependencies" error — and different dependency types need different tokens (a plain class as the token for a normal service, `getRepositoryToken()` for a TypeORM repository, `getQueueToken()` for a BullMQ queue).
- Not keeping a reference to the mock, so its return value can't be controlled. After passing a mock via `useValue` in `providers`, if it isn't retrieved back out with `module.get(token)` in `beforeEach` and stored in a variable, the test has no way to call `.mockResolvedValue(...)` on it.
- Using the wrong pattern when testing an async method that is expected to throw. For a method that resolves normally, `await`-ing it directly and asserting on the result works fine; but for a method expected to reject/throw, you need the dedicated pattern `await expect(promise).rejects.toThrow(...)` — a plain `await` would just let the exception blow up inside the test instead of being asserted on.
- Trusting editor autocomplete without checking what it inserted. This bit me more than once across this milestone and the last one: typing `expect` got autocompleted into `expectCookies` from an unrelated internal path (`supertest/lib/cookies`); earlier, `create` and `describe` were autocompleted into imports from completely unrelated packages (`domain`, `zod`). These look plausible at a glance but are unrelated to what's actually needed, and often leave behind unused imports that only surface as confusing compile errors later.
- Leaving unused imports behind after fixing code, which can cause compilation errors that are hard to trace back to the actual leftover line.

**How can you ensure that unit tests cover all edge cases?**

The approach is to go through every conditional branch in the method under test and ask "what happens if this condition is true, and what happens if it's false," then write a test for each branch — not just the happiest, most common path. For example, `findOne` has an `if (cat == null)` check, so at minimum it needs two tests: one for the repository successfully finding the record (the positive case) and one for the repository returning `null` (the negative/edge case), asserting the correct exception is thrown. Beyond a simple success-vs-throw split, edge cases can also include extreme input values (0, negative numbers, empty strings), a dependency returning an empty array instead of `null`, or a dependency throwing an unexpected error. The core method is to never test only the ideal case, but to trace every path the code can actually take and write a test for each one.

## What I did

Added real unit tests (beyond the earlier `should be defined` checks) for `CatsService.findOne` and `CatsController.findOne` in the `cats-demo` project: mocked the TypeORM repository/service dependencies with `jest.fn()`, retrieved the mock references via `module.get()`, and wrote tests covering both the success path and the edge case (repository returns `null` → service throws `NotFoundException`). All test suites pass (6 tests, 3 suites).

Code: https://github.com/AlanLijm/cats-demo