# Role-Based Authorization (RBAC) in NestJS — Reflection

## How does Auth0 store and manage user roles?

Auth0 manages roles through a three-layer structure: Permissions, Roles, and Users. First I defined a Permission on the API (`delete:cats`), which represents a single, specific action a user might be allowed to do. Then I created a Role (`admin`) and attached that permission to it — a Role is really just a named bundle of permissions that makes management easier, so you don't have to assign individual permissions to every user one by one. Finally, I assigned the Role to a specific user (`admin@test.com`) via User Management.

Importantly, the Role itself never actually appears in the access token — only its underlying permissions do. When RBAC is enabled for an API and "Add Permissions in the Access Token" is turned on, Auth0 flattens all the permissions from every role a user holds into a single `permissions` array and embeds that directly in the JWT access token (e.g. `"permissions": ["delete:cats"]`). If a user has no role assigned, or if either of those two settings is off, that array comes back empty — I actually ran into this directly when I forgot to assign the `admin` role to my test user and my backend rejected a request that should have succeeded, because the token had `"permissions": []`.

Enable RBAC is the master switch that turns on the whole permission-evaluation system for that API; without it Auth0 won't compute a user's permissions at all, no matter how the roles/permissions are set up. Add Permissions in the Access Token is a second, separate switch that decides whether those computed permissions actually get written into the token itself, rather than only being queryable elsewhere (e.g. via the Management API). Both need to be on for a backend that reads permissions straight off the JWT — which is exactly what my NestJS `RolesGuard` does.

## What is the purpose of a guard in NestJS?

A Guard runs at a very specific point in the request lifecycle: right before the request reaches the Controller's route handler. Its job is to answer one question — "can this request continue?" — by returning `true` to let it through, or `false` / throwing an exception to block it there and then. If a Guard blocks a request, the Controller method (and anything after it) never runs at all.

In this task I used two Guards stacked together, and they each answer a different question. `JwtAuthGuard` (wrapping `AuthGuard('jwt')`) handles **authentication** — it checks whether the incoming token is valid: correctly signed by Auth0, not expired, issued for the right audience. It's answering "who are you / are you really who you say you are". `RolesGuard` handles **authorization** — it runs after `JwtAuthGuard`, reads the already-verified user info off `request.user`, and checks whether that user actually has the required permission for this specific action. It's answering "given that we know who you are, are you allowed to do this". That's why the order in `@UseGuards(JwtAuthGuard, RolesGuard)` matters — `RolesGuard` depends on `request.user` already being populated by the guard before it.

This is different from an Interceptor, like the `LoggingInterceptor` I wrote in milestone 7. An Interceptor wraps around the handler's execution to do side-effect work — logging, timing, transforming the response — but it isn't meant to be the thing that decides whether a request is allowed to proceed. Guards are specifically the access-control layer, and they run earlier than Interceptors in the pipeline.

## How would you restrict access to an API endpoint based on user roles?

I used a combination of a custom decorator and two stacked Guards. `@Roles('delete:cats')` is just a label — it uses NestJS's `SetMetadata` to attach metadata to the `remove()` method, saying "this endpoint requires the `delete:cats` permission". The label itself doesn't check anything; it's purely declarative.

The actual enforcement happens in `@UseGuards(JwtAuthGuard, RolesGuard)`, applied on top of the same method, in that specific order. When a request comes in for `DELETE /cats/:id`, `JwtAuthGuard` runs first and verifies the JWT is valid, populating `request.user` with the decoded token payload. Then `RolesGuard` runs, using NestJS's built-in `Reflector` to read the `@Roles(...)` metadata off the handler, and compares it against `request.user.permissions`. If the required permission is present, the request is allowed through to `remove()`; if not, `RolesGuard` throws a `ForbiddenException` and the method never executes.

```typescript
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('delete:cats')
remove(@Param('id', ParseIntPipe) id: number) {
  return this.catsService.remove(id);
}
```

I verified this end-to-end with two real Auth0 test users: `admin@test.com`, who has the `admin` role (which grants `delete:cats`), successfully deleted a cat and got a 200 response. `member@test.com`, with no role assigned, got a 403 Forbidden with the message "You do not have permission to perform this action" — the request never reached the service layer at all.

## What are the security risks of improper authorization, and how can they be mitigated?

Improper authorization can let a user perform actions they shouldn't be able to, leading to real, sometimes irreversible damage — like an unprivileged user deleting data they had no right to touch. A few concrete risks I can point to from this task:

**Forgetting to guard an endpoint.** If `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(...)` are simply left off a sensitive method, that endpoint becomes callable by anyone, silently — there's no error, it just works for everyone. Mitigation: apply guards deliberately and consistently to every state-changing endpoint (not just as an afterthought), and it helps to have tests that specifically assert a protected endpoint rejects unauthenticated/unauthorized requests.

**Trusting client-supplied data for authorization decisions.** If a permission or role check were based on something the client sends directly (e.g. a `role` field in the request body) instead of data verified server-side, anyone could just claim to be an admin — nothing stops them from lying, since that data carries no proof. Authorization must be based on data that's been cryptographically verified — in this case, the `permissions` claim inside a JWT that's signature-checked against Auth0's public key (via JWKS), not on anything the request itself asserts about the caller.

**Guard order and silent misconfiguration.** During this task, my `.env` file wasn't actually being passed into the Docker container, so `AUTH0_DOMAIN` was `undefined` at runtime — this didn't crash the app, it just made every request fail JWT verification with a confusing network error. A less careful implementation could easily turn a misconfiguration like this into a silent "fail open" (letting requests through when verification can't be performed), which would be far more dangerous than failing loudly. Mitigation: guards should always fail closed (deny by default) when something is misconfigured or an error occurs, rather than assuming things are fine — and errors during authentication/authorization should be logged, not swallowed.
