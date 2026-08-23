# NestJS Dependency Injection — Reflection (Milestone 6.4)

## How does dependency injection improve maintainability?

Instead of a class manually creating (`new`) its own dependencies, Nest's DI container automatically creates and manages instances of `@Injectable()` classes, and injects them wherever they're declared as a constructor parameter:

```typescript
constructor(private readonly catsService: CatsService) {} // no `new` here
```

This improves maintainability because:
- **Decoupling** — a class doesn't need to know how its dependency is constructed. If `CatsService`'s constructor changes later (e.g. a new dependency is added), the classes that consume it don't need to change at all.
- **Testability** — a mock service can be injected in place of the real one during unit tests, without needing a real database or HTTP context.
- **Reduced duplication** — without DI, every class that needs a given dependency would have to manually construct it, spreading construction logic throughout the codebase. DI centralizes that responsibility in the container.

## What is the purpose of the `@Injectable()` decorator?

`@Injectable()` marks a class as a **provider** — meaning it can be managed, instantiated, and injected by Nest's DI container. "Provider" is a broader term than "service": most providers are services, but a provider can be anything Nest's DI container manages this way (e.g. a repository or a factory).

Without `@Injectable()`, a class isn't registered with the DI system, and Nest has no way to know how to create or inject it — attempting to inject it into a controller's constructor would fail.

## What are the different types of provider scopes, and when would you use each?

| Scope | When a new instance is created | Lifetime | When to use |
|---|---|---|---|
| **`DEFAULT` (`SINGLETON`)** | Once, when the application starts | Shared for the entire lifetime of the application | The default choice for most providers — stateless business logic, shared caches, anything that doesn't need to be isolated per request |
| **`REQUEST`** | Once per incoming HTTP request | Only for the duration of that request, then discarded | When a provider needs to hold data tied to the current request context (e.g. the current authenticated user) |
| **`TRANSIENT`** | Each time the provider is injected somewhere | Not shared — each consumer gets its own instance | When complete isolation between consumers is needed and no state should be shared |

A key distinction between `SINGLETON` and `TRANSIENT` is what determines the instance count:
- `SINGLETON`: the instance count is **always 1**, regardless of how many times or how many different classes inject it — everyone shares the same instance.
- `TRANSIENT`: the instance count **grows with the number of injections** — each class that injects it gets its own separate instance.
- `REQUEST`: the instance count tracks the number of **in-flight HTTP requests**, not the number of injections — a new instance is created for each request, independent of how many consumers exist.

**Note:** `REQUEST` scope has a caveat — any provider (or controller) that injects a `REQUEST`-scoped dependency is itself automatically "bubbled up" into `REQUEST` scope, without needing to declare this explicitly. For example, if `CatsController` injects a `REQUEST`-scoped `CatsService`, `CatsController` becomes `REQUEST`-scoped too, even without any scope configuration on the controller itself. This can cascade through the dependency graph and add rebuild overhead on every request. Nest's own documentation recommends only using `REQUEST` scope when actually needed (e.g. to access request-specific context), rather than as a default.

### Hands-on verification and a corrected assumption

I tested this by changing `CatsService`'s scope in the `cats-demo` project and repeating a `POST /cats` (`{"name":"Tom"}`) followed by a `GET /cats`:

- **Expected with `TRANSIENT`:** that data would not persist between requests, since transient providers create a new instance "each time they're injected."
- **Actual result:** `Tom` still persisted across both requests — identical to `SINGLETON` behavior.

The reason: `CatsController` itself defaults to `SINGLETON` scope and is only instantiated **once**, at application startup. Since injection happens at the moment a class is instantiated, the injection of `CatsService` into `CatsController` also only happens once — during startup. So even though `CatsService` was `TRANSIENT`, the number of injections that actually occurred was still 1, making it behave identically to a singleton in this specific case. `TRANSIENT`'s real behavior (multiple independent instances) would only become visible if the consumer itself were re-instantiated per request (e.g. if `CatsController` were also `REQUEST`-scoped), or if multiple different classes each injected their own copy of `CatsService`.

By contrast, `REQUEST` scope is not tied to how many times a provider is injected — it is tied directly to the HTTP request lifecycle. Regardless of whether the consumer is a singleton or not, Nest creates a fresh instance of a `REQUEST`-scoped provider for every new incoming request. Testing this with `CatsService` set to `REQUEST` scope, the expectation is that `GET /cats` would return an empty array after a prior `POST`, since the `POST` and `GET` are two separate requests, each getting its own fresh instance.

This also clarifies the earlier `TRANSIENT` case: if `CatsController` were to become `REQUEST`-scoped (which happens automatically the moment it injects a `REQUEST`-scoped dependency — see the bubbling note above), it would be re-instantiated on every request, meaning its constructor — and therefore the injection of any `TRANSIENT` dependency into it — would also re-run on every request. In that scenario, `TRANSIENT`'s "new instance per injection" behavior and `REQUEST`'s "new instance per request" behavior would produce the same observable result, but for different underlying reasons: `TRANSIENT` never "knows" about requests at all, it only reacts to injection events; it just happens that, once the controller itself becomes request-scoped, an injection event and a new request become the same moment.

## How does NestJS automatically resolve dependencies?

When Nest starts the application (`NestFactory.create(AppModule)`), it reads the module tree (`AppModule` and everything it imports) and, for each class marked `@Controller()` or `@Injectable()`, inspects its constructor parameters. Using TypeScript's type metadata, Nest identifies what type each parameter expects (e.g. `CatsService`), looks up (or creates, depending on scope) the matching provider, and injects it automatically — without needing an explicit `@Inject()` decorator in the common case where the type itself is enough to identify the dependency.

This is only possible because providers are registered in a module's `providers` array (or exported/imported between modules) — Nest builds its dependency graph from these declarations, then resolves and injects instances according to each provider's scope (`SINGLETON`, `REQUEST`, or `TRANSIENT`).