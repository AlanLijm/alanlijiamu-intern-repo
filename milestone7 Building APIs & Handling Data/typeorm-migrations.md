# Seeding & Migrations in TypeORM — Reflection

## What is the purpose of database migrations in TypeORM?

The purpose of migrations is to give each database schema change an independent, ordered file that records exactly what changed. These files can be pushed to Git like any other code, so the whole team shares the same history of schema changes and can execute them in the same order — keeping everyone's database structure consistent, whether it's a teammate's machine or a production server. If a mistake happens, the migration's `down()` method lets you precisely roll back that specific change.

## How do migrations differ from seeding?

Migrations and seeding operate on different layers. Migrations change the schema/structure of a table — what columns exist, their types, constraints (e.g. `CREATE TABLE`, `ALTER TABLE ADD "color"`). Seeding, on the other hand, inserts data/content into an already-existing table structure (e.g. `catRepository.save(...)`) — it doesn't change what the table looks like, just what's stored in it.

Migrations can be rolled back precisely via their `down()` method, since each one is a self-contained, reversible change. Seeding doesn't have this built-in rollback mechanism — it's just a script that runs once and inserts data.

One practical connection between the two: if a migration changes the structure (e.g. adding a required column), existing data — and any code that reads/writes that table, like the entity — needs to stay in sync with the new structure, or operations will fail (as I saw when a stale entity definition caused a 500 error after a rollback that the code hadn't caught up with).

## Why is it important to version-control database schema changes?

Version-controlling database schema changes brings several benefits. First, it gives you a full history — who made a change, when, and why (via commit messages). Second, it enables team collaboration without conflicts, since everyone shares and builds on the same history of changes rather than making untracked, ad-hoc edits. Third, changes can be audited — a migration can be reviewed (e.g. via a pull request) before it's merged and applied to the real database. Finally, it keeps the schema consistent across different environments (development, testing, production), since the same set of migration files can be run in each environment to produce the exact same structure.

## How can you roll back a migration if an issue occurs?

To roll back a migration, you run `typeorm migration:revert`, which executes the last-applied migration's `down()` method — the exact reverse SQL of what `up()` did (e.g. `DROP COLUMN` to undo an `ADD COLUMN`). TypeORM also removes that migration's record from the `migrations` table, so it will be treated as pending again if you re-run it later.

One important thing I learned from actually doing this: rolling back the database structure isn't enough on its own — the application code (like the entity) also needs to be updated to match, or the app will break trying to query a column that no longer exists. It's also worth noting that operations like `DROP COLUMN` can permanently lose data, so rollbacks should be done carefully, ideally with a backup, in a real production setting.