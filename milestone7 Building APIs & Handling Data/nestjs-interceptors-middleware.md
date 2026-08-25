# NestJS Interceptors & Middleware — Reflection

## What is the difference between an interceptor and middleware in NestJS?

Middleware runs before interceptors in the request lifecycle. Middleware only has access to the raw `req`/`res` objects and simply calls `next()` to pass control along — it cannot access or modify the return value, since the controller hasn't executed yet at that point. Interceptors, on the other hand, wrap around the controller method call and have two stages: logic before `next.handle()` runs before the controller executes, and logic inside `.pipe(tap(...))` (or similar RxJS operators) runs after the controller returns — meaning interceptors can inspect or transform the response data, which middleware cannot do.

## When would you use an interceptor instead of middleware?

Since the controller's execution is wrapped inside the interceptor's process, you should use an interceptor whenever you need something that depends on the controller having already run. Two concrete examples: measuring how long the controller took to execute (as in my `LoggingInterceptor`, which logs the time between before and after `next.handle()`), and filtering or transforming the response data before it's sent to the client — e.g. `ClassSerializerInterceptor` removes fields marked `@Exclude()` so sensitive information never reaches the JSON response. Middleware can't do either of these, since it runs before the controller and never sees the return value.

## How does `LoggerErrorInterceptor` help?

`LoggerErrorInterceptor` is not part of the NestJS core framework — it comes from the third-party logging package `nestjs-pino` (a Pino-based logger for NestJS). By default, when `nestjs-pino` logs an HTTP error, the `err` property it attaches only contains generic error details and doesn't reveal the actual error message or stack trace. Registering `LoggerErrorInterceptor` globally (via `app.useGlobalInterceptors(new LoggerErrorInterceptor())`) fixes this: it captures the actual exception thrown during request handling and attaches it properly to the response object's `err` property, so that `pino-http` can log the real, detailed error information instead of a generic placeholder. This is useful for debugging production issues, since it ensures error logs are actually informative.