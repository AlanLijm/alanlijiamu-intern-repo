# NestJS Setup — Reflection (Milestone 6.2)

## What files are included in a default NestJS project?

After running `nest new cats-demo`, the default `src/` folder contains:

| File | Role |
|---|---|
| `main.ts` | The application's **entry point** — bootstraps and starts the whole Nest app |
| `app.module.ts` | The **root module** — the top-level container that assembles the entire application |
| `app.controller.ts` | The default root Controller, handling the `/` route |
| `app.service.ts` | The default root Service |
| `app.controller.spec.ts` | Unit test file for `AppController` |

Outside `src/`, a few config files are also worth noting:
- `package.json` — dependencies and npm scripts (e.g. `start:dev`)
- `tsconfig.json` — TypeScript compiler configuration
- `nest-cli.json` — configuration for the Nest CLI itself

When I later ran `nest generate module/controller/service cats`, the CLI added a self-contained `src/cats/` folder (`cats.module.ts`, `cats.controller.ts`, `cats.service.ts`, plus `.spec.ts` test files) following the exact same pattern as the default `app.*` files.

## How does `main.ts` bootstrap a NestJS application?

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

- `NestFactory.create(AppModule)` reads `AppModule` — the description of the entire application's structure — and **assembles** the application: it initializes all modules, controllers, and services, and sets up the dependency injection (DI) container that wires everything together.
- `app.listen(3000)` takes the fully assembled application and makes it start **listening on port 3000** for incoming HTTP requests.

In short: `create()` builds the application from the blueprint (`AppModule`), and `listen()` turns the built application into a running server that can actually handle requests.

## What is the role of `AppModule` in the project?

`AppModule` is the **root module** of the application — the top-level container that Nest reads first via `NestFactory.create(AppModule)`.

Importantly, `AppModule` does not directly manage every controller and service in the app. Instead, each feature is organized into its own module:

```typescript
// cats.module.ts — assembles CatsController and CatsService for the "cats" feature
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

```typescript
// app.module.ts — assembles all feature modules of the whole application
@Module({
  imports: [CatsModule],       // imports the feature module, not individual pieces
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

So the relationship is:
- **`CatsModule`** assembles the pieces needed for one feature (`CatsController` + `CatsService`).
- **`AppModule`**, as the root module, assembles all the feature modules of the entire application (`CatsModule`, and potentially `UsersModule`, `AuthModule`, etc. in the future) via its `imports` array — it delegates the internal details to each feature module and simply brings them together at the top level.

## How does NestJS's structure help with scalability?

This modular structure improves scalability in a few ways:

1. **Faster development for new features** — since every module follows the same fixed pattern (Module + Controller + Service), adding a new feature mostly means reproducing this structure and filling in feature-specific logic, rather than designing the architecture from scratch each time.
2. **Isolated changes** — adding a new module only requires adding one line to `AppModule`'s `imports` array; existing modules don't need to be touched at all. This minimizes the risk of accidentally breaking existing features when adding new ones.
3. **Easier to scale a team** — since modules are self-contained, different developers/teams can work on different modules (e.g. one on `CatsModule`, another on `AuthModule`) in parallel with minimal conflict, because each module's internal logic doesn't leak into others.

### Hands-on verification

I confirmed point 2 directly: when generating `CatsModule` via the Nest CLI, the only existing file that was modified was `app.module.ts` (a single line was added to its `imports` array). Neither `app.controller.ts` nor `app.service.ts` — the original default files — were touched at all. This demonstrates that the modular structure isolates new features from existing ones, reducing the risk of unintended side effects as the codebase grows.