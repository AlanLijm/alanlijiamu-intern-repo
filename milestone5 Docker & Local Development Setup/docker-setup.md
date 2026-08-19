# Docker Setup — Reflection

## What is the difference between `docker run` and `docker-compose up`?

`docker run` starts a single container from a single image, with all
options (ports, volumes, environment variables, network) specified
manually as command-line flags every time. It's fine for quick,
one-off containers but becomes unwieldy for anything beyond one
service.

`docker-compose up` (or `docker compose up`) reads a `docker-compose.yml`
file that declares one or more services, their images/build context,
ports, volumes, environment variables, and how they depend on and
communicate with each other. A single command then builds/starts all
of the defined services together, on a shared network, in the correct
order. It replaces a series of manual `docker run` commands with one
declarative, version-controlled configuration file.

## How does Docker Compose help when working with multiple services?

Focus Bear's backend needs several services running together: the
NestJS API, PostgreSQL, and Redis. Docker Compose lets all of these be
defined in one file, so:

- Every service is started with the correct configuration automatically,
  with no manual setup steps.
- Services can reach each other by service name (e.g. the API can
  connect to `postgres:5432` instead of a manually configured IP).
- The whole stack can be started or stopped together with one command
  (`docker compose up` / `docker compose down`), keeping local
  environments consistent across the team.
- Configuration lives in a file checked into the repo, so environment
  setup is reproducible and reviewable like any other code change.

To see this in practice, I created a small test `docker-compose.yml`
defining two services, an `nginx` web server and a `postgres` database:

```yaml
services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: example
      POSTGRES_USER: testuser
      POSTGRES_DB: testdb
    ports:
      - "5432:5432"
```

Running `docker compose up -d` pulled both images and started both
containers (`web-1` and `db-1`) together as a single project, visible
as one group in Docker Desktop. `docker compose ps` listed both
services' status, ports, and images in one place. This showed
concretely how Compose turns what would otherwise be two separate
`docker run` commands (with manual network setup between them) into
one declarative file and one command. Running `docker compose down`
afterwards stopped and removed both containers together, while the
underlying `nginx` and `postgres` images remained cached locally for
reuse.

## What commands can you use to check logs from a running container?

- `docker logs <container>` — shows the accumulated logs of a single
  container.
- `docker logs -f <container>` — follows the logs in real time (like
  `tail -f`).
- `docker compose logs` — shows logs from all services defined in the
  compose file.
- `docker compose logs -f <service>` — follows logs for a specific
  service within a Compose project in real time.

## What happens when you restart a container? Does data persist?

Restarting a container (`docker restart <container>` or
`docker compose restart`) stops and starts the same container again;
any files written inside the container's writable layer (not backed
by a volume) persist across a restart, because the container itself
still exists — it isn't removed.

However, if the container is removed and recreated (e.g. via
`docker compose down` followed by `docker compose up`, or `docker rm`
+ `docker run`), any data stored only inside the container's own
filesystem is lost, since a new container starts from a clean image
layer. Data that needs to survive container removal/recreation (like
a PostgreSQL database) must be stored in a Docker **volume** or a
bind-mounted host directory, which exists independently of the
container's lifecycle.