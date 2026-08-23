# Docker + NestJS — Reflection (Milestone 6.6)

## How does a Dockerfile define a containerized NestJS application?

A Dockerfile is a set of instructions describing how to build an image that can run the application in an isolated container. For the `cats-demo` project:

```dockerfile
# ---------- Stage 1: builder ----------
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

Each instruction plays a specific role:
- `FROM` — selects the base image (a Linux environment with Node.js pre-installed)
- `WORKDIR` — sets the working directory inside the container
- `COPY package*.json ./` followed by `RUN npm install` (before copying the rest of the source) — copies only the dependency manifest first, so Docker can cache the `npm install` layer and skip re-running it when only source code (not dependencies) changes
- `COPY . .` — copies the rest of the project into the container
- `RUN npm run build` — compiles TypeScript to JavaScript (equivalent to `nest build`, producing the `dist/` folder)
- `EXPOSE 3000` — documents which port the container listens on (matches `app.listen(3000)` in `main.ts`)
- `CMD ["node", "dist/main.js"]` — the command run when the container starts, executing the compiled JavaScript directly rather than using `npm run start:dev` (which is for local development with hot reload)

A `.dockerignore` file (listing `node_modules`, `dist`, `.git`) was also added to keep unnecessary files out of the build context, mirroring how `.gitignore` works.

## What is the purpose of a multi-stage build in Docker?

A multi-stage build splits the Dockerfile into separate stages so that tools only needed to *build* the application (the TypeScript compiler, dev dependencies, and the source code itself) don't end up in the final image used to *run* it.

- **Stage 1 (`builder`)** — uses the full `node:20` image, installs all dependencies (including dev dependencies), and compiles the app with `npm run build`.
- **Stage 2 (runtime)** — starts from a fresh, smaller `node:20-alpine` image, installs only production dependencies (`npm install --omit=dev`), and copies over just the compiled `dist/` folder from the builder stage via `COPY --from=builder /app/dist ./dist`.

The final image contains nothing from stage 1 except the compiled output — no source code, no dev dependencies, no build tools.

### Hands-on verification

- **Image size:** `docker images` showed the final `cats-demo` image at **226MB**, noticeably smaller than a full `node:20` image would produce on its own, since the runtime stage is built on the much lighter `node:20-alpine` base and excludes dev dependencies.
- **No source code in the final container:** running `docker compose exec api sh` and then `ls` inside the running container showed only `dist`, `node_modules`, `package.json`, and `package-lock.json` — there was no `src/` folder, confirming that the source code from the builder stage was never carried into the final image.

## How does Docker Compose simplify running multiple services together?

Instead of manually running `docker build`, then `docker run` for each service with the correct network, port, and environment settings, Docker Compose defines everything declaratively in one `docker-compose.yml`:

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db

  db:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_USER: catuser
      POSTGRES_PASSWORD: catpass
      POSTGRES_DB: catsdb
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

A single command, `docker compose up`, then:
- builds the `api` image from the local `Dockerfile` (`build: .`)
- pulls and starts the `db` service from the official `postgres:16` image
- starts `db` before `api`, per `depends_on`
- connects both containers on a shared network automatically, so `api` can reach `db` by service name (`db`) without manual network configuration
- maps container ports to the host machine (`3000:3000`, `5432:5432`)

### Hands-on verification

Running `docker compose up` started both `cats-demo-db-1` and `cats-demo-api-1`. The API logs showed the same successful NestJS startup sequence seen when running locally (`AppModule dependencies initialized`, `CatsController {/cats}` route mapping, etc.), and `POST`/`GET` requests to `http://localhost:3000/cats` worked identically to the non-containerized version — confirming the containerized API was reachable from the host through the mapped port.

**Observation on current limitations:** while both containers start and can communicate over the Docker network, `CatsService` in this demo still stores data in an in-memory array rather than actually connecting to the `db` container. This became apparent when the containers were restarted (stopping the foreground `docker compose up` and restarting with `-d`) and a previously-added cat no longer appeared in `GET /cats` — the in-memory state had been wiped by the restart. Wiring `CatsService` to actually query PostgreSQL (rather than an in-memory array) would be the natural next step to make the persistence real.

## How can you expose API logs and debug a running container?

- **View existing logs for a service:**
  ```powershell
  docker compose logs api
  ```
  Prints the current log output and returns to the prompt.

- **Follow logs in real time:**
  ```powershell
  docker compose logs -f api
  ```
  Keeps the terminal attached, printing new log lines as they're produced (`-f` = `--follow`). Useful for watching how the app responds to live requests. `Ctrl+C` detaches without stopping the container.

- **Get a shell inside the running container:**
  ```powershell
  docker compose exec api sh
  ```
  `sh` (rather than `bash`) is used because the `node:20-alpine` runtime image doesn't include `bash` by default. Once inside, commands like `ls` and `ls dist` can be used to inspect exactly what files exist in the running container — this is how the multi-stage build's effect (no `src/` folder present) was confirmed above. `exit` leaves the shell without stopping the container.