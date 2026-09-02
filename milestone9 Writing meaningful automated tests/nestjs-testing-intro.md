# Milestone 9.5 — Introduction to Testing in NestJS

## Reflection

**What are the key differences between unit, integration, and E2E tests?**

Unit tests call the code directly and mock its dependencies. Integration tests also call the code directly, but use real (non-mocked) dependencies to verify they work together correctly. E2E tests send a real HTTP request through the whole pipeline (routing, guards, controller, service) and check the actual response.

**Why is testing important for a NestJS backend?**

Testing reduces the risk of bugs and defends against breaking existing functionality when the code changes. If we didn't test a backend, it could return wrong data or make database operation mistakes. This would affect all the services that depend on this backend.

**How does NestJS use `@nestjs/testing` to simplify testing?**

I used `Test.createTestingModule()` to build a mini NestJS module just for testing, without running the real application or connecting to a real database. On top of that, `@nestjs/testing` lets me replace real dependencies with fake ones using the `providers` array, e.g. `{ provide: CatsService, useValue: { create: jest.fn(), ... } }`. For special dependencies like a TypeORM repository or a BullMQ queue, NestJS provides `getRepositoryToken()` and `getQueueToken()` to find the correct injection token to override. This is what actually makes testing simple — I can test one class in isolation without needing the real database, queue, or any other service to be running.

**What are the challenges of writing tests for a NestJS application?**

One challenge was dependency injection errors — if a class's dependencies (like a TypeORM repository or another service) aren't provided or mocked in the testing module, Nest throws a "can't resolve dependencies" error, and I had to figure out exactly which token each dependency needed (a plain class for `CatsService`, but `getRepositoryToken()`/`getQueueToken()` for the TypeORM and BullMQ ones).

Another challenge was environment/tooling mismatches rather than the test code itself. Jest's module resolution didn't match how the real app resolves absolute-style imports (fixed with `modulePaths`), and some node_modules packages ship as ES Modules which Jest can't parse by default (fixed with `transformIgnorePatterns`). On top of that, since the app's Docker image is a multi-stage build, the final production image doesn't include devDependencies like Jest at all — tests have to run against the earlier "builder" stage instead.

A smaller but recurring challenge was trusting editor autocomplete without double-checking it — it repeatedly suggested unrelated imports (like `create` from `domain` or `describe` from an unrelated package) that looked plausible but had nothing to do with Jest.

## What I did

Explored and ran the three unit tests in the `cats-demo` project (`src/app.controller.spec.ts`, `src/cats/cats.service.spec.ts`, `src/cats/cats.controller.spec.ts`) using `@nestjs/testing` and Jest, fixing dependency-injection, module-resolution, and ESM-transform issues along the way until all three test suites passed.

Code: https://github.com/AlanLijm/cats-demo