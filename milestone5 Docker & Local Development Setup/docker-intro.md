# Docker Introduction — Reflection

## How does Docker differ from a virtual machine?

A virtual machine virtualizes an entire hardware stack, running a full guest
operating system on top of a hypervisor. Each VM is heavyweight (GBs of disk,
slow to boot) but strongly isolated.

Docker containers, by contrast, share the host machine's OS kernel and only
isolate the process and file system layer (via Linux namespaces and cgroups).
This makes containers much lighter (typically MBs, not GBs) and much faster
to start (seconds, not minutes), at the cost of slightly weaker isolation
than a VM.

In short: VMs virtualize hardware; containers virtualize the operating
system.

## Why is containerization useful for a backend like Focus Bear's?

- **Environment consistency**: the backend, database, and any supporting
  services run identically on every developer's machine, in CI, and in
  production, eliminating "works on my machine" bugs.
- **Fast onboarding**: a new developer can clone the repo and run
  `docker-compose up` to get a fully working backend + database, without
  manually installing and configuring each dependency.
- **Isolation between services**: the backend, database, and other services
  each run in their own container, so their dependencies and versions never
  conflict with each other or with the host machine.
- **Reproducible deployments**: the same image tested in CI is the one
  deployed to production, reducing deployment-time surprises.

## How do containers help with dependency management?

Each container packages the application together with the exact runtime,
libraries, and system tools it needs, as defined in a `Dockerfile`. This
means dependencies are pinned and version-locked per service rather than
installed globally on a developer's machine. Tools like `docker-compose`
let multiple services (e.g. backend API, PostgreSQL, Redis) be defined and
started together with their correct versions and network configuration,
without any manual local installation.

## What are the potential downsides of using Docker?

- **Learning curve**: Dockerfiles, docker-compose, networking, and volumes
  add real complexity for developers new to containers.
- **Performance overhead**: on macOS/Windows, file system I/O through the
  virtualization layer can be slower than native, which can slow down
  things like hot-reloading during development.
- **Debugging friction**: inspecting logs, attaching debuggers, and shelling
  into a running container is more involved than debugging a local process
  directly.
- **Resource usage**: running several containers simultaneously (backend,
  database, cache, etc.) can be demanding on a developer's machine memory.
- **Image bloat**: poorly written Dockerfiles can produce large, slow-to-build
  images if dependencies and layers aren't managed carefully.