# Debugging with VS Code & Breakpoints

## The bug I actually debugged

While testing `GET /cats`, I kept getting a real, reproducible 500 error. Using
a breakpoint inside `AllExceptionsFilter.catch()`, I found the exception was
`TypeError [ERR_INVALID_ARG_TYPE]`, with a stack trace pointing into
`typeorm-encrypted`'s `decryptData` function, at the line
`Buffer.from(key, 'hex')`.

I first suspected the `ownerEmail` column (which is `nullable: true` and
encrypted) — a `NULL` value seemed like the obvious cause. But reading the
transformer's actual source showed it already guards against `null`/`undefined`
before calling decrypt, so that wasn't it. The real clue was that the crash was
on the *encryption key* argument (`key`), not the field value.

Since a breakpoint inside `node_modules/typeorm-encrypted`'s TypeScript source
never actually triggered, I switched to editing the compiled JS directly
(`lib/crypto.js`) and added a temporary `console.log`. That's what finally
proved it: `key` was `undefined`.

Root cause: `src/config/encryption-config.ts` reads
`process.env.ENCRYPTION_KEY!` once, at the moment the module is first
imported. `main.ts` imports `AppModule` (which pulls in `CatsModule` → `Cat`
entity → `encryption-config.ts`) *before* `bootstrap()` runs and NestJS's
`ConfigModule` actually loads `.env` into `process.env`. So when running
locally with `npm run start:debug`, the encryption config captured `key` as
`undefined` — permanently, since it's a plain object built once at import
time. This never showed up under `docker-compose` because Docker injects
`env_file: .env` values as real OS environment variables *before* Node even
starts, so the timing problem doesn't exist there.

Fix: added `import 'dotenv/config';` as the very first line of `main.ts`, so
`.env` is loaded into `process.env` before any other import (including the
`AppModule` chain) runs. Verified with `GET /cats` returning `200` both
locally and via `docker-compose up`.

## How do breakpoints help compared to console.log?

It is hard to use breakpoints in a third party's library — a breakpoint I set
in `typeorm-encrypted`'s TypeScript source never actually triggered, because
the package ships compiled JS as what's really executed, and VS Code couldn't
map the `.ts` breakpoint to it. On top of that, `nest start --watch` only
watches my own `src` folder, not `node_modules`, so even after I started
setting the breakpoint (and later a `console.log`) directly in the compiled
`lib/crypto.js`, the running process didn't pick up the change until I fully
restarted it.

In that situation, `console.log` was the more reliable tool — it doesn't
depend on sourcemaps lining up correctly, and once the file it's in is
reloaded, it just works. Breakpoints are still more powerful when debugging my
own code, though: pausing execution lets me inspect a whole object (like
`exception`) in the Variables panel, not just whatever specific fields I
remembered to log.

## What is the purpose of launch.json, and how does it configure debugging?

`launch.json` tells VS Code how to connect its debugger to a Node process.
The key setting is `"request"`: `"launch"` means "VS Code starts a brand new
Node process for you", while `"attach"` means "connect to a Node process
that's already running". Since I always start the app myself in the terminal
with `npm run start:debug`, I used `"attach"` — the process already exists,
so VS Code just needs to connect to it, not start another one.

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to NestJs",
  "port": 9229,
  "restart": true
}
```

- `"port": 9229` — this is Node's default debug protocol port. Running with
  `--debug`/`--inspect` (which `nest start --debug` does under the hood)
  automatically opens this port for a debugger to connect to.
- `"restart": true` — handles the case where `nest --watch` recompiles my code
  and restarts the app process. Without this, the debugger would just
  disconnect and stay disconnected when the process restarts; with it, VS
  Code automatically reconnects to the new process. This is exactly what was
  happening during the "Lost connection to debugee, reconnecting" messages I
  saw mid-session.

## How can you inspect request parameters and responses while debugging?

I ended up doing this two ways, without realizing at first they were the same
kind of technique:

- **Bruno's "Generate Code" feature** — clicking the `</>` icon shows the
  actual `curl` command Bruno is about to send, including headers like
  `Authorization: Bearer ...`. This is how I confirmed a token was really
  being sent, since the Headers tab itself didn't show it.
- **The VS Code terminal / pino logs** — every request/response is logged as
  structured JSON (via `pino-http`), including a `req` object with `method`,
  `url`, and `headers`. Reading these logs let me inspect exactly what came
  in and what error came back, without needing to pause execution at all.

## How can you debug background jobs that don't run in a typical request-response cycle?

An app like this can have things running alongside the main request/response
cycle — in this project, `BullModule` (BullMQ, backed by Redis) sets up a
background worker (`notifications.processor.ts`) that isn't triggered
directly by an HTTP request. It just runs continuously, checking Redis for
jobs and staying connected to it.

I actually ran into this by accident: several times my debugger paused inside
`bullmq`/`ioredis` internals (`worker.js`, `DataHandler.js`) even though I
hadn't called any queue-related endpoint. That's because this background
worker runs concurrently with the main app the whole time it's up — so its
activity (and any exceptions in it) can show up "for free" while debugging
something else entirely. To debug the worker's own logic on purpose, though,
the approach has to be different from debugging an HTTP endpoint: you can't
just send a request and wait — you'd set a breakpoint directly inside the
processor's job-handling function, then actually trigger something that pushes
a job onto the queue, and wait for the worker to pick it up.