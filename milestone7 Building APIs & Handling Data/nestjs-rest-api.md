# NestJS REST API — Reflection

## What is the role of a controller in NestJS?

The controller is responsible for accepting incoming HTTP requests (GET, POST, PUT, DELETE, etc.), parsing the request parameters (via `@Param()`, `@Body()`, `@Query()`), delegating the actual work to the corresponding service, and returning the service's result back to the client as the HTTP response. It should not contain business logic itself — it acts purely as the entry point / routing layer between the client and the application's logic.

## How should business logic be separated from the controller?

All business logic — data processing, validation, storage, lookups — should live in the service layer, not the controller. The controller should only handle request-related concerns: parsing parameters and forwarding the call to the service.

This separation is implemented through Dependency Injection (DI): the service class is decorated with `@Injectable()`, and the controller declares it as a constructor parameter (e.g. `constructor(private readonly catsService: CatsService) {}`). NestJS's DI container automatically creates an instance of the service and injects it into the controller at runtime, so the controller never has to construct the service itself.

## Why is it important to use services instead of handling logic inside controllers?

- **Testability** — Separating the code makes testing much easier. The service can be tested independently of the HTTP environment, without needing to run the server or send a real request.
- **Maintainability** — Small changes to the business logic only require editing the service, without touching the controller or its routes.
- **Reusability** — The same business logic can be reused elsewhere in the application, since any controller (or other provider) can inject the same service, rather than the logic being locked inside one specific route handler.

## How does NestJS automatically map request methods (GET, POST, etc.) to handlers?

Decorators like `@Get()`, `@Post()`, `@Put()`, `@Delete()` are responsible for attaching metadata to a controller method — declaring which HTTP method and path it should handle. This doesn't create the route immediately; it just labels the method.

When the Nest application starts, Nest scans all controllers and reads this metadata via reflection, then registers the corresponding routes (combining the class-level `@Controller()` prefix with the method-level path) into the routing table of the underlying HTTP framework (Express by default).

When an actual HTTP request comes in, the underlying framework matches the request's method and path against the registered routes, and triggers the execution of the corresponding controller method.