# Running PostgreSQL in Docker — Reflection

## What are the benefits of running PostgreSQL in a Docker container?

- **No local installation required**: PostgreSQL doesn't need to be
  installed directly on the host machine, avoiding version conflicts
  with other projects that might need a different PostgreSQL version.
- **Consistency across the team**: everyone runs the exact same
  PostgreSQL version and configuration, defined in `docker-compose.yml`
  and checked into the repo, eliminating "works on my machine" issues.
- **Easy setup and teardown**: a fresh, clean database instance can be
  spun up with `docker compose up -d` and removed with
  `docker compose down`, useful for testing migrations or resetting
  local state without touching the host system.
- **Isolation**: the database runs in its own container, so it doesn't
  interfere with (or get interfered with by) other services or tools
  on the local machine.

## How do Docker volumes help persist PostgreSQL data?

By default, any data written by a container lives in that container's
own writable layer, which is deleted along with the container. Since
PostgreSQL stores its actual database files in a specific directory
(`/var/lib/postgresql/data`), mounting a named Docker volume to that
path detaches the data's storage location from the container's own
lifecycle:

```yaml
services:
  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

I verified this directly: after creating a table and inserting a row
into the `testdb` database, I ran `docker compose down` (which removes
the container entirely) followed by `docker compose up -d` to create a
brand new container. Reconnecting with `psql` and querying the table
showed the inserted row was still there — proving the volume, not the
container, is what actually held the data.

## How can you connect to a running PostgreSQL container?

The simplest way, without installing anything extra locally, is to
run `psql` from inside the container itself using `docker exec`:

```bash
docker exec -it my-postgres psql -U testuser -d testdb
```

Alternatively, since the `docker-compose.yml` maps the container's
port 5432 to the host's port 5432, any local database client — `psql`
installed on the host, pgAdmin, DBeaver, TablePlus, etc. — can connect
directly to `localhost:5432` using the credentials defined in the
compose file's `environment` section (`POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB`).