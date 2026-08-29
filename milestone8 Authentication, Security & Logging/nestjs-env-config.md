Handling Environment Variables & Configuration in NestJS — Reflection
How does @nestjs/config help manage environment variables?

@nestjs/config gives NestJS a proper, framework-integrated way to manage environment variables, instead of scattering raw process.env.XXX references throughout the codebase. With isGlobal: true, ConfigService becomes available for injection anywhere in the app without needing to re-import ConfigModule in every feature module. Because it plugs into NestJS's dependency injection system, classes like my JwtStrategy just declare configService: ConfigService as a constructor parameter and Nest automatically provides an instance — nothing is manually created or globally referenced, which also makes it much easier to substitute a fake config in tests later.

The bigger practical win is validationSchema: by defining a Zod schema listing every required environment variable and its expected type, the app validates all of them once, at startup, before anything else runs. If a variable is missing or the wrong type, ConfigModule.forRoot() throws immediately and the app refuses to start — I confirmed this directly by removing AUTH0_DOMAIN from .env and getting Config validation error: AUTH0_DOMAIN: Invalid input: expected string, received undefined instead of a silent runtime failure later. Plain dotenv doesn't give you any of this — it just loads whatever is in the file into process.env with no validation and no structured way to consume it. @nestjs/config also supports loading different .env files per environment via envFilePath, which plain dotenv doesn't handle out of the box either.

Why should secrets (e.g., API keys, database passwords) never be stored in source code?

If secrets are hardcoded into source code and that code gets pushed to GitHub — even to a private repository — there's real leak risk: the repo could accidentally be made public, access could be granted to a third-party tool or collaborator who shouldn't see it, or the code could be forked/cloned elsewhere. And critically, even if the secret is later removed and a new commit is pushed, it still exists in the git history — anyone with access to the repo can dig it out via git log/git show. Deleting the line doesn't undo the exposure.

There's also a practical, non-security reason: the same codebase needs to run in multiple environments — local development, staging, production — each with a different database address, different credentials, different API keys. If secrets are hardcoded, the code literally can't run correctly across environments without being edited each time, which defeats the point of having one codebase. Keeping secrets in environment variables (loaded from a .env file that's excluded via .gitignore) solves both problems at once: the secret never enters version control, and swapping environments is just a matter of swapping which .env values are loaded, with zero code changes.

How can you validate environment variables before the app starts?

I used zod to define a validation schema in src/config/env.validation.ts — it declares the expected type for every required environment variable (e.g. AUTH0_DOMAIN must be a non-empty string, PORT/DB_PORT must coerce to a number), so anything missing or the wrong shape fails validation.

That schema is wired into NestJS via the validationSchema option in ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }). This makes the check run globally, once, as part of module initialization — before the rest of the app's providers/controllers are even set up.

I tested this by commenting out AUTH0_DOMAIN in .env and restarting the container. NestJS started initializing, ConfigModule.forRoot() ran the schema check against the loaded environment variables, found AUTH0_DOMAIN missing, and threw Config validation error: AUTH0_DOMAIN: Invalid input: expected string, received undefined. The app never finished starting — it crashed and the container exited with code 1, rather than running with an incomplete/broken configuration. Restoring the variable and restarting brought it back to a normal, successful startup.

How can you separate configuration for different environments (e.g., local vs. production)?

@nestjs/config supports loading different .env files based on the current environment via the envFilePath option, passed as an array:

typescript
```
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: envSchema,
  envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
}),
```

NestJS checks the files in order and uses the first one that exists. If NODE_ENV=production, it first looks for .env.production; if that file exists, its values are used. If not, it falls back to the plain .env. This means the same codebase can run in local development and production without any code changes — only which .env file is present on that machine changes. It's also a security boundary: a real .env.production with production secrets would only ever exist on the production server/CI, never on a developer's laptop, so a compromised dev machine can't leak production credentials.

I added this to the project and verified it: with NODE_ENV unset locally, the app still starts normally, correctly falling back to .env (since .env.undefined doesn't exist). This project only has one real environment so far, so .env.production doesn't exist yet, but the mechanism is in place and would take effect automatically the moment such a file and NODE_ENV=production exist together.

Separately, I also created a .env.example file (safe to commit, containing only variable names with no real values) — this addresses the related but distinct problem of documenting what configuration a given environment needs, without ever exposing real secrets in version control.