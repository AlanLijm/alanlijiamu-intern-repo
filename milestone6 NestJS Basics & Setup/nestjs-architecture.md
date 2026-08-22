# NestJS Architecture — Reflection (Milestone 6.3)

## What is the purpose of a module in NestJS?

A module is a container that groups together related pieces of functionality — its controllers, providers (services), and any other modules it depends on (`imports`) or exposes to other modules (`exports`).

Every NestJS application has at least one root module (`AppModule`), which Nest reads first via `NestFactory.create(AppModule)`. Larger applications are split into feature modules (e.g. `CatsModule`), each responsible for one area of functionality, and the root module assembles all of them together via its `imports` array:

```typescript
// cats.module.ts — assembles CatsController and CatsService for the "cats" feature
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

```typescript
// app.module.ts — assembles all feature modules of the application
@Module({
  imports: [CatsModule], // add more modules to this same array, e.g. [CatsModule, UsersModule]
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

This gives the application a consistent, predictable structure and keeps each feature's code self-contained.

## How does a controller differ from a provider?

**Provider** is a broader term than "service" — it refers to anything marked `@Injectable()` that can be created and managed by Nest's DI container (most commonly a Service, but also things like repositories or factories). A Service is simply the most common kind of provider.

- A **Controller**'s responsibility is narrow and HTTP-specific: it receives incoming requests (`@Get()`, `@Post()`, etc.), extracts data from them (`@Body()`, `@Param()`, `@Query()`), delegates the actual work to a provider, and returns a response. It should not contain business logic itself.
- A **Provider** (e.g. `CatsService`) is where the actual business logic lives — data processing, calculations, database access, etc. Because it's decoupled from any HTTP context, the same service can be reused by multiple controllers, injected into other services, called from a scheduled task (cron job), or tested independently without needing to simulate an HTTP request.

Technically, nothing stops a developer from writing business logic directly inside a controller — but doing so violates **separation of concerns**: it makes the logic harder to reuse elsewhere, harder to test in isolation, and unnecessarily tightly coupled to the HTTP layer.

Example from the `cats` module:

```typescript
// cats.service.ts — business logic, no HTTP awareness
@Injectable()
export class CatsService {
  private cats: string[] = [];
  create(name: string) { this.cats.push(name); }
  findAll(): string[] { return this.cats; }
}
```

```typescript
// cats.controller.ts — only handles HTTP, delegates to the service
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Post()
  create(@Body('name') name: string) {
    this.catsService.create(name);
    return `Added cat: ${name}`;
  }

  @Get()
  findAll(): string[] {
    return this.catsService.findAll();
  }
}
```

## Why is dependency injection useful in NestJS?

Instead of a controller manually creating (`new`) an instance of a service, Nest's DI container automatically creates and manages instances of `@Injectable()` classes, and injects them wherever they're declared as a constructor parameter:

```typescript
constructor(private readonly catsService: CatsService) {} // no `new` here
```

This is useful because:
- **Decoupling** — the controller doesn't need to know how `CatsService` is constructed. If the service's constructor changes later (e.g. a new dependency is added), the controller doesn't need to change at all.
- **Testability** — a mock service can be injected in place of the real one during unit tests, without needing a real database or HTTP context.
- **Single responsibility** — the controller focuses purely on HTTP handling, while the DI container handles the lifecycle of the actual business logic classes.

## How does NestJS ensure modularity and separation of concerns?

NestJS enforces modularity and separation of concerns through its combination of decorators, module boundaries, and DI:

1. **Decorators define roles clearly** — `@Controller()` marks HTTP-handling classes, `@Injectable()` marks business-logic providers, `@Module()` groups them together. This makes each class's responsibility explicit and consistent across the codebase.
2. **Modules isolate features** — each feature (e.g. `CatsModule`) is self-contained. Adding a new feature module only requires one new line in `AppModule`'s `imports` array; existing modules and files don't need to be touched.
3. **Dependency injection decouples logic from delivery** — because business logic lives in providers rather than controllers, the same logic can be reused across different entry points (REST, WebSockets, cron jobs) without duplication.

### Hands-on verification

Building the `CatsModule` end-to-end confirmed this in practice: `CatsController` never manually instantiates `CatsService` — it declares it as a constructor dependency, and Nest injects it automatically. Testing `POST /cats` and `GET /cats` confirmed the controller correctly delegates all data handling to the service, and that adding this entire feature module required no changes to the pre-existing `app.controller.ts` or `app.service.ts` — only a single import added to `app.module.ts`.