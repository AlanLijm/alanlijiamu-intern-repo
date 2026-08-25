# NestJS Validation with Pipes — Reflection

## What is the purpose of pipes in NestJS?

Pipes operate on the input data before it reaches the controller's handler method. They serve two purposes: **transformation** — converting input data into the expected type (e.g. `ParseIntPipe` converts a route parameter from a string to a number), and **validation** — checking whether the input data meets certain rules, and rejecting the request (with a `BadRequestException`) if it doesn't.

## How does `ValidationPipe` improve API security and data integrity?

`ValidationPipe` acts as a gatekeeper at the boundary of the application. From a **security** perspective, it rejects any request whose data doesn't match the expected DTO shape before that data can reach the service or database layer — this prevents malformed or malicious input from causing unexpected behavior downstream. From a **data integrity** perspective, it guarantees that every field ends up with the correct type and format (e.g. `age` is always a real number, never a string), so the application never has to deal with inconsistent data later on.

## What is the difference between built-in and custom pipes?

Built-in pipes (such as `ParseIntPipe` and `ValidationPipe`) come with NestJS itself — they are ready to use out of the box and cover common, general-purpose needs like type conversion and DTO validation. Custom pipes, on the other hand, are defined by the developer by implementing the `PipeTransform` interface (with its own `transform()` method), and are used when the application has a specific business rule that no built-in pipe covers — for example, checking that a cat's breed is one of a fixed list of allowed values.

## How do decorators like `@IsString()` and `@IsNumber()` work with DTOs?

Decorators like `@IsString()` and `@IsNumber()` are provided by the `class-validator` library and attach metadata to each field of the DTO. When a request comes in, the body data is transformed into a DTO instance (e.g. `CreateCatDto`), and the globally registered `ValidationPipe` (registered in `main.ts` via `app.useGlobalPipes(new ValidationPipe())`) reads this metadata. It then calls the `validate()` function from `class-validator`, which checks each field one by one — e.g. verifying that `name` is a string and `age` is a number. If any field fails validation, the pipe throws a `BadRequestException` (400) with the collected error messages; otherwise, the request proceeds to the controller.