# Connecting to PostgreSQL with TypeORM — Reflection

## How does `@nestjs/typeorm` simplify database interactions?

`@nestjs/typeorm` simplifies database interactions in several ways. First, `TypeOrmModule.forRoot()` handles connection setup and manages the connection pool for me — I don't need to write any raw SQL or manually manage connections. Second, `@InjectRepository()` lets me inject a repository object directly into my service, the same way I'd inject any other provider — I don't need to write extra code to share a connection across services, since Nest's DI container handles this automatically. Finally, I don't need to know the underlying SQL for operations like insert, find, or update — TypeORM translates my method calls (like `save()`, `findOneBy()`) into the actual SQL queries behind the scenes.

## What is the difference between an entity and a repository in TypeORM?

The `Cat` entity defines the shape of the data — it describes the table's columns (via `@Column()`), the primary key (via `@PrimaryGeneratedColumn()`), and the corresponding TypeScript types. It's just a data structure; it has no methods for interacting with the database.

The `CatsRepository`, on the other hand, is the object that actually operates on the database — it provides methods like `find()`, `save()`, `findOneBy()`, and `remove()` to query and modify the `cats` table. Unlike the entity (which we can create with a plain object or `new`), the repository is obtained via dependency injection using `@InjectRepository(Cat)`, and Nest's DI container handles creating and providing it.

## How does TypeORM handle migrations in a NestJS project?

TypeORM handles database schema changes through migrations. The `migration:generate` command compares the structure defined by the entities against the database's actual current structure. Any difference is written into a generated migration file, containing an `up()` method with the SQL needed to apply the change (e.g. creating a table) and a `down()` method with the SQL to reverse it, in case something goes wrong and the change needs to be rolled back. When migrations are executed via `migration:run`, TypeORM also maintains a `migrations` table in the database that records which migrations have already been run, so re-running the command won't execute the same migration twice.

## What are the advantages of using PostgreSQL over other databases in a NestJS app?

Compared to MySQL, PostgreSQL implements the SQL standard more strictly and completely, and supports more advanced data types (like native JSON/JSONB).

Compared to MongoDB (a NoSQL database), PostgreSQL is a relational database with full ACID transaction support — as seen in the migration I ran, where the schema change was wrapped in `START TRANSACTION` / `COMMIT`, ensuring the change either fully succeeds or is fully rolled back, with no partial state in between. This matters for an app like Focus Bear, where user data, habits, and settings have clear relationships that need to stay consistent.

Within the TypeORM/NestJS ecosystem specifically, PostgreSQL is the most widely used and best-supported database, with the most mature documentation and community examples.