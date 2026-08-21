# NestJS Intro — Reflection (Milestone 6.1)

## 1. What are the key differences between NestJS and Express.js?

Express is an **unopinionated framework** — it doesn't enforce any project structure, so different developers or teams tend to produce different code styles and architectures depending on personal preference. NestJS, by contrast, is an **opinionated framework**: it enforces a modular architecture (Modules, Controllers, Services) and requires developers to follow its conventions (decorators, dependency injection). This trades some flexibility for **consistency, scalability, and maintainability**, which matters a lot in large, team-based projects like Focus Bear's backend.

Other differences:
- Express is JavaScript-first; TypeScript needs to be configured manually. NestJS is TypeScript-first by default.
- NestJS's architecture is inspired by Angular (decorators, dependency injection, module system).
- NestJS is actually built on top of Express (or Fastify) — it doesn't replace Express, it adds a structured layer on top of it.

## 2. Why does NestJS use decorators extensively?

Decorators attach **metadata** to classes, methods, and parameters, telling the framework how to treat them at runtime — this isn't just "showing" what a class does, it's registering information that Nest's framework reads to decide how to wire the application together.

Decorators work at several levels:
- **Class level** — `@Injectable()` marks `CatsService` as a provider that can be managed and injected by the DI container. `@Controller('cats')` marks `CatsController` as the handler for routes under `/cats`. `@Module()` groups related controllers/providers together.
- **Method level** — `@Post()` / `@Get()` map controller methods to specific HTTP methods.
- **Parameter level** — `@Body()`, `@Param()`, `@Query()` extract specific data from the incoming request.

This lets Nest wire up the application **declaratively** — the framework reads these decorators to automatically handle routing and dependency injection, instead of requiring manual registration code.

## 3. How does NestJS handle dependency injection?

Instead of manually creating (`new`) an instance of a service inside a controller, NestJS's **DI container** (Inversion of Control container) automatically creates and manages instances of classes marked with `@Injectable()`.

Example from the `cats` module I built:

```typescript
// cats.service.ts
@Injectable()
export class CatsService {
  private cats: string[] = [];
  create(name: string) { this.cats.push(name); }
  findAll(): string[] { return this.cats; }
}
```

```typescript
// cats.controller.ts
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {} // no `new` here
  ...
}
```

- `@Injectable()` marks `CatsService` as available for the DI container to manage — it tells Nest "this class can be instantiated and injected wherever it's needed."
- In `CatsController`, the dependency is simply declared as a constructor parameter. Nest reads the parameter's **type** (`CatsService`) and automatically creates and injects the corresponding instance — no `@Inject()` decorator is needed in this common case.

**Without DI**, the controller would have to construct its own dependency manually:

```typescript
export class CatsController {
  private catsService: CatsService;
  constructor() {
    this.catsService = new CatsService(); // manual construction
  }
}
```

This tightly couples the controller to the service's construction logic. With DI, the controller never handles instantiation — so if `CatsService`'s constructor changes later (e.g. a new parameter is added), the controller doesn't need to change at all. This decoupling also makes unit testing easier, since a mock service can be injected in place of the real one, and it gives Nest control over instance lifecycle (by default, providers are singletons shared across the app).

## 4. What benefits does modular architecture provide in a large-scale app?

In a large-scale team, modular architecture enforces a **consistent structure** across the codebase — every feature follows the same Module/Controller/Service pattern. This lowers the onboarding cost for new developers, since they can predict where to find certain logic just by knowing the convention, rather than having to reverse-engineer each developer's individual coding style.

It also provides:
- **Separation of concerns** — business logic in Services stays independent from routing logic in Controllers, so changes to one are less likely to break the other.
- **Testability** — because dependencies are injected rather than hard-coded, modules and their components can be tested in isolation with mocked dependencies.
- **Reusability** — a self-contained module (e.g. an `AuthModule`) can be reused across projects or shared between teams without significant rework.

## Hands-on verification

To confirm my understanding, I generated a `CatsModule` (`nest generate module/controller/service cats`) and implemented a minimal in-memory create/findAll flow. Testing confirmed:
- `POST /cats` with `{"name":"Tom"}` → `Added cat: Tom`
- `GET /cats` → `["Tom"]`

This verified that the controller correctly injected the service via the constructor (no manual `new`), and that the same service instance persisted data across separate HTTP requests — demonstrating Nest's default singleton provider scope.