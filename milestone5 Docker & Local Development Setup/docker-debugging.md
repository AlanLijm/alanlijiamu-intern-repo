# Debugging & Managing Docker Containers — Reflection

## How can you check logs from a running container?

- `docker logs <container>` shows the accumulated stdout/stderr output
  of a container since it started.
- `docker logs -f <container>` follows the logs in real time, useful
  while actively developing or reproducing an issue.
- `docker compose logs -f <service>` does the same for a specific
  service inside a Compose project.

I tested this against the `my-postgres` container and could see the
database's startup/initialization log output, which is exactly what
you'd check first if a service isn't starting or behaving as
expected.

## What is the difference between `docker exec` and `docker attach`?

`docker exec` starts a **new process inside an already-running
container**. For example, `docker exec -it my-postgres bash` opens a
brand new bash shell inside the container, separate from the
container's main process (in this case, the Postgres server). Exiting
that shell does not stop the container — the main process keeps
running untouched. This is the safe, common way to poke around inside
a container (inspect files, run a one-off command, open a database
client shell) without risking the main application.

`docker attach` instead connects your terminal directly to the
container's **main running process** (PID 1) — the same process
started by the image's `ENTRYPOINT`/`CMD`. You see its live
stdin/stdout directly, and if that process is interactive, typing in
that terminal sends input to it. The risk with `attach` is that
pressing Ctrl+C can send a signal that stops the container's main
process entirely (unless the container was started with special
flags), whereas exiting an `exec` shell is harmless.

In short: `exec` opens a new, disposable process for debugging.
`attach` connects to the container's existing main process directly.

I tested this directly with `docker attach my-postgres`. Simply closing
the terminal window (instead of properly detaching) caused the
`my-postgres` container to exit — `docker ps -a` showed it as
`Exited (0)` immediately afterward, with the same container ID
(confirming it wasn't removed, just stopped). This is a good practical
illustration of the risk described above: with `exec`, closing or
exiting the shell never affects the main process, but with `attach`,
an improper disconnect can stop the container's main process (here it
exited cleanly with code 0, not a crash — but the service still went
down unexpectedly). Restarting the container with
`docker compose up -d` afterwards brought it back up cleanly, and
querying the earlier test data confirmed it was untouched — since the
data lived in the Docker volume, not in the container's own
filesystem, stopping and restarting the container had no effect on it.

## How do you restart a container without losing data?

`docker restart <container>` (or `docker compose restart`) stops and
starts the container's process again without removing the container
itself — its filesystem layer and any attached volumes remain
untouched. I verified this directly: after `docker restart my-postgres`,
`docker ps` showed the exact same container ID as before the restart,
confirming it was the same container instance, not a new one.

This is different from removing and recreating a container (e.g.
`docker compose down && docker compose up`), which discards the old
container and its writable layer — data only survives that if it was
stored in a Docker volume (as covered in the 5.3 reflection), rather
than relying on `restart` alone.

## How can you troubleshoot database connection issues inside a containerized NestJS app?

- **Check the container is actually running**: `docker ps` — a
  stopped or crash-looping database container is the most common
  cause of connection failures.
- **Check the database's own logs**: `docker logs <db-container>` for
  errors on startup (e.g. failed authentication, corrupted data
  directory, port already in use).
- **Verify the connection string/environment variables** the NestJS
  app is using match the database service's actual name, port, user,
  and password as defined in `docker-compose.yml`. Inside Docker
  Compose's network, services should connect to each other by
  **service name** (e.g. `postgres`), not `localhost`, since each
  container has its own network namespace.
- **Check the app's own logs**: `docker logs <api-container>` (or
  `docker compose logs -f api`) to see the actual connection error
  NestJS is throwing (e.g. `ECONNREFUSED`, authentication failure).
- **Exec into the database container and connect locally** with
  `psql` to confirm the database itself is healthy and reachable,
  isolating whether the problem is the database or the network/config
  between the two services.
- **Check `docker inspect`** on both containers to confirm they're on
  the same Docker network, since services on different networks can't
  reach each other by service name.