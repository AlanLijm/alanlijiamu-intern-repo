# Milestone 9.7 — Mocking Dependencies & Database Interactions in NestJS

## Reflection

**Why is mocking important in unit tests?**

Mocking is important because it lets tests run without depending on a real database or external services, so the test environment is more stable and less affected by outside factors (network, current database state, concurrency, etc.) — the same test produces the same result every time it runs. It also keeps a test's scope limited to the single unit being tested, isolating it from whether its dependencies are working correctly — for example, when testing `CatsService.remove`, using `jest.spyOn` to short-circuit `findOne` means the test doesn't need to worry about whether the repository is wired up correctly; it can focus purely on `remove`'s own logic. Because mocked tests run fast and produce stable, focused results, it becomes practical to run them frequently, which is what actually helps catch problems in the code early.

**How do you mock a NestJS provider (e.g., a service in a controller test)?**

NestJS uses dependency injection: a class like `CatsController` doesn't create its own `CatsService`, it just declares that it needs one in its constructor, and Nest's container supplies an instance at runtime. In a test, `Test.createTestingModule()` builds a mini version of that container, and inside its `providers` array you can register `{ provide: CatsService, useValue: fakeObject }` — this tells the testing container "whenever something asks for a `CatsService`, hand it this fake object instead." The token (`provide`) is usually the class itself; for special dependencies like a TypeORM repository or a BullMQ queue, `getRepositoryToken()`/`getQueueToken()` are used to get the correct token. The fake object's methods are built with `jest.fn()`, and `module.get(token)` retrieves that same fake object later so its return values can be controlled with `.mockResolvedValue(...)`.

A different situation is mocking a method that belongs to the object itself rather than an injected dependency — for example, `CatsService.remove()` calls its own `findOne()` internally. That can't be replaced through `providers` since it isn't external; instead, `jest.spyOn(service, 'findOne')` replaces that one method directly on the real, already-created object, while every other method on it keeps working normally.

**What are the benefits of mocking the database instead of using a real one?**

Not needing a real database connection makes tests run faster and removes network/setup overhead. It also gives full freedom over what the "database" returns — for instance, a repository mock can be told to return `null` directly to simulate "record not found," instead of having to delete real rows from an actual database to create that situation. Results are also more reliable: a real database can behave inconsistently between runs (network issues, concurrency, leftover data), while a mock's behaviour is entirely controlled by the test and stays the same every time. Finally, it keeps a service test focused on the service's own logic — a service test shouldn't fail just because the database is unreachable, since that's the repository/database layer's concern, not the service's.

**How do you decide what to mock vs. what to test directly?**

The guiding principle is to only exercise the logic the current test actually cares about, and mock away everything else. If a method internally calls another method on the same object, and that other method already has its own dedicated tests elsewhere (like `findOne`, tested separately in milestone 9.6), then `jest.spyOn` should replace it with a fixed return value when testing the method that calls it (like `remove`) — this way the test for `remove` only has to verify what `remove` itself does with the result, not re-verify `findOne`'s internal logic. If a method has no nested calls to other (already-tested) methods and no external dependencies, it can usually just be tested directly, since running its real implementation is simpler and more convincing than mocking it. External dependencies — a database repository, a message queue, a third-party API — should almost always be mocked, since they're slow, can be unstable, and their own correctness isn't what this particular unit test is meant to verify. In short: mock anything that is outside the scope of "the one thing this test is checking," whether that's an external dependency or logic that's already covered by its own tests.

## What I did

Extended the `cats-demo` project's tests to cover mocking and spying: added a `jest.fn()`-based `useValue` mock for `CatsController.remove()` (mocking the whole `CatsService` dependency, same pattern as the existing `findOne` controller test), and added a `jest.spyOn(service, 'findOne')` test for `CatsService.remove()` to short-circuit the internal `findOne()` call instead of re-testing it, while separately verifying `catsRepository.remove` was called correctly. All test suites pass (8 tests, 3 suites).

Code: https://github.com/AlanLijm/cats-demo