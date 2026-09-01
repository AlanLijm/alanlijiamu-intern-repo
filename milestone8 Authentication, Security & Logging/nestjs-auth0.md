# Authentication in NestJS with Auth0 & JWT — Reflection

## How does Auth0 handle authentication compared to traditional username/password auth?

In traditional authentication, the password is stored in the application's own database, and the backend compares the submitted password against it directly. With Auth0, the password is stored entirely on Auth0's side instead — I registered my test account (`admin@test.com`) directly through Auth0, not through any code in `cats-demo`. My backend never sees or handles the raw password at all; its only job is to verify that the JWT it receives is genuinely signed by Auth0 and hasn't been tampered with. Auth0's own `.env` values — `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` — are just configuration pointing at which Auth0 tenant/API to trust; they aren't credentials themselves, and no user's password ever passes through this project's code or `.env` file.

## What is the role of JWT in API authentication?

With traditional session-based authentication, the server has to store session data (in memory or a database) for every logged-in user and look it up on every request — the server is "stateful," keeping its own record of who's logged in. With Auth0 and JWT, the user's information (like `permissions`) is packed directly into the token itself, so the server doesn't need to store any session state at all — it just verifies the token's signature and reads the information straight out of it. This "stateless" design also scales better: if the app runs across multiple servers behind a load balancer, any server holding the public key can independently verify a token, with no need to share session data between servers the way traditional session auth would require.

## How do `jwks-rsa` and public/private key verification work in Auth0?

RSA is the name of the asymmetric encryption algorithm (named after its three inventors — Rivest, Shamir, Adleman), providing a mathematically paired private/public key. `RS256` combines RSA with SHA-256 hashing: Auth0 hashes the JWT's header and payload with SHA-256, then encrypts that hash with its private key to produce the signature. The private key itself never leaves Auth0 — only the resulting signed token travels to the client and then to my backend.

When my backend receives a request, `jwks-rsa` (via `passportJwtSecret` in `jwt.strategy.ts`) reads the `kid` (key ID) from the JWT's header, fetches the matching public key from Auth0's JWKS endpoint (`https://${domain}/.well-known/jwks.json` — "JWKS" stands for JSON Web Key Set, a standard format Auth0 publishes its current public keys in), and uses that public key to decrypt the signature and recompute the hash — confirming the token was genuinely signed with the corresponding private key and hasn't been altered. My `JwtStrategy` also explicitly restricts `algorithms: ['RS256']`, rejecting any token that declares a different (or no) signing algorithm in its header, which prevents a forged token from bypassing verification entirely.

Two settings in `passportJwtSecret` matter for how this runs in practice: `cache: true` stores the fetched public key in memory so it doesn't need to be re-fetched from Auth0's JWKS endpoint on every single request; `rateLimit: true` with `jwksRequestsPerMinute: 5` caps how many requests can be made to that endpoint in a short time, protecting against abuse or a bug causing excessive requests to Auth0's servers. Because the public key is always fetched live rather than hardcoded, Auth0 can rotate its signing keys at any time without requiring any code change or redeployment on my side.

## How would you protect an API route so that only authenticated users can access it?

To restrict a route to any authenticated user — regardless of role or permission — `@UseGuards(JwtAuthGuard)` alone is enough:

```typescript
@Get('some-route')
@UseGuards(JwtAuthGuard)
someMethod() { ... }
```

`JwtAuthGuard` extracts the JWT from the request's `Authorization` header and verifies it was genuinely signed by Auth0, using RS256 signature verification via the JWKS public key described above. If verification fails — the token is missing, expired, or the signature doesn't check out — the request is rejected before it ever reaches the route handler.

This is different from `RolesGuard`, which I used on `cats-demo`'s `DELETE /cats/:id` endpoint:

```typescript
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('delete:cats')
remove(@Param('id', ParseIntPipe) id: number) {
  return this.catsService.remove(id);
}
```

`RolesGuard` goes a step further than `JwtAuthGuard`: it compares the `@Roles(...)` metadata declared on the handler against the permissions decoded from the already-verified JWT (`request.user.permissions`), and is only needed when a route requires a *specific* permission — not just any logged-in user. `JwtAuthGuard` alone answers "are you authenticated"; stacking `RolesGuard` on top answers the stricter question "are you authenticated *and* authorized for this specific action."