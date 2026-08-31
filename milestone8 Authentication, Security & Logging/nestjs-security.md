# Security Best Practices in NestJS — Reflection

## What are the most common security vulnerabilities in a NestJS backend?

**SQL injection.** If user input is concatenated directly into a raw SQL string (e.g. a name field containing `x' OR '1'='1`), the input gets interpreted as SQL syntax instead of a data value, letting an attacker read or destroy data it shouldn't have access to. In `cats-demo` this risk is largely mitigated because I use TypeORM's repository methods (`find`, `save`, etc.) rather than hand-written SQL — TypeORM sends parameterized queries under the hood, so whatever a user types is always treated as a plain data value being matched, never as executable SQL. This protection would disappear if I ever dropped to TypeORM's raw `query()` method and built the SQL string by concatenation.

**Broken authentication/authorization.** If a backend doesn't properly verify who's making a request and what they're allowed to do, any unauthenticated or unprivileged user can call endpoints that should be restricted. I addressed this in milestone 9 with two stacked guards: `JwtAuthGuard` verifies the request's identity — checking that the JWT is genuinely signed by Auth0, not expired, and issued for the right audience (authentication: "who are you"). `RolesGuard` runs after it and checks whether that already-verified user actually has the permission the endpoint requires, by reading the `@Roles(...)` metadata off the handler and comparing it against `request.user.permissions` from the JWT (authorization: "are you allowed to do this").

**XSS (Cross-Site Scripting).** My `CreateCatDto` only validates that a field is a well-formed string — it doesn't strip or sanitize HTML/script content, so something like `<script>alert('hacked')</script>` can be stored as-is and returned as-is in a JSON response. Because `cats-demo` is a pure JSON API with no server-rendered HTML, that alone isn't an executed attack — the real risk shows up downstream, if some frontend consuming this API unsafely renders the value (e.g. via `innerHTML`) instead of treating it as plain text.

**CSRF.** CSRF relies on the browser automatically attaching credentials (cookies) to a request the attacker tricks the browser into sending. My API uses stateless JWT auth carried manually in the `Authorization` header rather than cookies — nothing forces a victim's browser to attach that header to a cross-site request — so the classic CSRF attack doesn't apply here the way it would to a cookie-based session.

**CORS misconfiguration.** NestJS/Express does not allow cross-origin requests unless `app.enableCors()` is explicitly called. `main.ts` never calls it, so browsers currently block any cross-origin `fetch`/XHR to this API by default — safe by omission. This will need to change deliberately (with an explicit origin allowlist, not a wildcard) the day a frontend on a different origin needs to call this API.

## How does `helmet` improve application security?

The milestone task named `@fastify/helmet`, but `cats-demo` runs on `@nestjs/platform-express` (`main.ts` calls `NestFactory.create` without a Fastify adapter, and `package.json` depends on `@nestjs/platform-express`), so I used the Express-targeted `helmet` package instead — same purpose, different package because it hooks into Express middleware rather than Fastify's plugin system:

```typescript
// main.ts
import helmet from 'helmet';
...
app.use(helmet());
```

I verified this wasn't just a no-op by running an A/B test on my own server. With the line commented out and the app rebuilt, `curl -I http://localhost:3000/` returned:

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
...
```

With `app.use(helmet())` restored and rebuilt, the same request returned:

```
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; ...; object-src 'none'; script-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
...
```

and `X-Powered-By: Express` was gone. Each header closes a specific gap: `Content-Security-Policy` restricts which sources scripts/styles/frames can load from (`default-src 'self'` means only my own origin), which limits how far an XSS payload can go even if one slips through, because the browser refuses to execute anything from an unlisted source. `Strict-Transport-Security` tells the browser to force HTTPS for this host for the next year, closing the window a man-in-the-middle attacker would otherwise have during a plain-HTTP request. `X-Frame-Options: SAMEORIGIN` stops other sites from embedding my pages in an `<iframe>`, which defends against clickjacking (an attacker overlaying a disguised, invisible iframe of my site over their own page to trick users into clicking something they didn't mean to). Removing `X-Powered-By` denies an attacker a free hint about which framework to target with known exploits. It's worth being precise about scope here: these headers protect *this API's own responses* — since `cats-demo` is pure JSON with no HTML views, the CSP header isn't actively defending anything today, but it's a deliberate defense-in-depth layer for if that ever changes; it does not, by itself, protect whatever separate frontend consumes this API's data.

## Why is rate limiting important for preventing abuse?

Without a limit on request rate, an endpoint can be hit as fast as the network allows — this enables two distinct kinds of abuse. First, plain denial-of-service: flooding the app (or the Postgres/Redis connections behind it) with enough traffic to degrade or crash it. Second, and more specific to this project, brute-force/credential-stuffing against the authentication path guarded by `JwtAuthGuard` — without a cap, an attacker can try enormous numbers of forged or stolen tokens per minute at effectively no cost; rate limiting puts a hard ceiling on how fast that guessing can happen, making the attack far more expensive.

I used `@nestjs/throttler` (the Express/NestJS-native equivalent of the fastify-specific `@fastify/rate-limit` named in the task), registered as a global guard the same way `AllExceptionsFilter` is registered as a global `APP_FILTER`:

```typescript
// app.module.ts
ThrottlerModule.forRoot({
  throttlers: [
    {
      ttl: 60000,   // 60-second window (ttl is in milliseconds)
      limit: 10,    // max 10 requests per window
    },
  ],
}),
...
providers: [
  ...,
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
],
```

I verified this actually blocks traffic rather than just being configured and unused, by firing 15 requests at the running app in under a second:

```powershell
1..15 | ForEach-Object { curl.exe -s -o $null -w "%{http_code}`n" http://localhost:3000/ }
```

The first 10 requests succeeded (`200`), and requests 11 through 15 all came back `429 Too Many Requests` with `ThrottlerException: Too Many Requests` — matching the `limit: 10` I configured exactly.

## How can sensitive configuration values be protected in a production environment?

`.env` is listed in `.gitignore`, so it never gets committed to GitHub — this is what actually prevents real secrets (`AUTH0_DOMAIN`, `DB_PASSWORD`, etc.) from leaking. Only `.env.example` is tracked, and it deliberately has no real values — it's just a template listing which variables the project needs, so a teammate (or future me on a new machine) knows what to fill in locally without any secret ever passing through git.

`src/config/env.validation.ts` defines a `zod` schema (`envSchema`) that requires each of these variables to exist and match a type, and `ConfigModule.forRoot({ validationSchema: envSchema })` runs that check once, at application startup. If a required variable is missing, the app fails to start at all and exits with an error immediately — before any request handling is even possible — rather than limping along with `undefined` values and failing in some confusing way later once real traffic arrives. This isn't hypothetical for me: in milestone 9, `AUTH0_DOMAIN` wasn't actually being passed into the Docker container, and because there was no startup validation catching it at the time, the app didn't crash — it just made every request fail JWT verification with a confusing error, and it took real debugging effort to trace that back to a missing env var. With `env.validation.ts` in place, that same misconfiguration would now surface instantly at startup with a clear "missing AUTH0_DOMAIN" error instead of a mysterious per-request failure.

Beyond what this repo covers: in an actual production deployment, secrets shouldn't live in a plaintext `.env` file on disk at all — they belong in the platform's secret manager (AWS Secrets Manager, GCP Secret Manager, or CI/CD-injected environment variables at deploy time), accessible only to what strictly needs them, and rotated periodically rather than left unchanged indefinitely.