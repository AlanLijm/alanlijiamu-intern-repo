# Using `typeorm-encrypted` for Data Encryption — Reflection

## Why does Focus Bear double encrypt sensitive data instead of relying on database encryption alone?

Database-level encryption (encryption "at rest") only protects data while it's sitting untouched on disk — it defends against a specific scenario: someone stealing the physical disk or an unencrypted backup file. But it does nothing to protect data from someone who can query the *running* database directly. If an attacker gains query access — through stolen database credentials, a SQL injection vulnerability, or an overly privileged insider — the database engine transparently decrypts everything for that query and hands back plaintext, exactly as it would for a legitimate request. At-rest encryption alone can't tell the difference between an authorized query and a malicious one.

I verified this distinction directly rather than just taking it on faith. After adding `typeorm-encrypted` to the `ownerEmail` field on `Cat` and inserting a record through the API, querying the running database directly with `psql` returned ciphertext:

```
name   | age | breed  | id | color |                  ownerEmail
---------+-----+--------+----+-------+----------------------------------------------
TestCat |   1 | Sphynx |  9 | pink  | ZRaWuLq23734FQL7P5cdIAi6igi7ZGcIog+5X5xv+qE=
```

while the API's own responses (`POST /cats` and `GET /cats/9`, which go through TypeORM's transformer) correctly returned the decrypted plaintext `alan@test.com`. That's the concrete case for double encryption: at-rest encryption alone leaves plaintext exposed to anyone with direct query access to the database, so sensitive fields need a second, application-level layer whose decryption key isn't stored in the database at all — someone who compromises only the database still can't read the value.

## How does `typeorm-encrypted` integrate with TypeORM entities?

It hooks into TypeORM's `transformer` mechanism on `@Column()`. I added a `transformer` property to the `ownerEmail` column, set to `new EncryptionTransformer(MyEncryptionTransformerConfig)`:

```typescript
// cat.entity.ts
import { EncryptionTransformer } from "typeorm-encrypted";
import { MyEncryptionTransformerConfig } from "../../config/encryption-config";

@Column({
  type: 'varchar',
  nullable: true,
  transformer: new EncryptionTransformer(MyEncryptionTransformerConfig),
})
ownerEmail?: string;
```

A transformer is a function pair TypeORM automatically calls: once before a value is written to the database (encrypt), and once after a value is read back (decrypt) — completely transparent to the rest of the codebase, so `catRepository.save()` and `find()` didn't need any changes.

`MyEncryptionTransformerConfig` itself is a plain object I defined separately, in `encryption-config.ts`, containing the key, algorithm, and IV length:

```typescript
// config/encryption-config.ts
export const MyEncryptionTransformerConfig = {
  key: process.env.ENCRYPTION_KEY!,
  algorithm: 'aes-256-cbc',
  ivLength: 16,
};
```

The `!` after `process.env.ENCRYPTION_KEY` is a TypeScript non-null assertion — `process.env` values are typed `string | undefined` since TypeScript can't know at compile time whether an env var is set, but `env.validation.ts`'s zod schema (built in the previous milestone) already guarantees `ENCRYPTION_KEY` is a required, validated string at application startup, so the assertion is safe here.

I ran into a real gotcha while writing the migration for this new column. My first instinct — mirroring how I'd added `color` earlier with a `DEFAULT` value — was to give `ownerEmail` a default like `'unknown'` for the existing rows. That doesn't work for an encrypted column: a default set directly in a migration's raw SQL bypasses the `EncryptionTransformer` entirely, since transformers only run through TypeORM's own repository methods, not raw SQL. The default would be stored as plaintext, but TypeORM has no way of knowing some rows are plaintext and others are ciphertext — it always tries to decrypt whatever is in that column. Trying to decrypt a plain string like `"unknown"` as if it were ciphertext fails, since it isn't in the format the algorithm expects (this matches a known issue documented in the package's own README FAQ, "Error: Invalid IV length"). I fixed this by making the column `nullable` instead of giving it a default, leaving the 6 existing rows empty and letting only new rows — written through TypeORM, and therefore correctly encrypted — populate the field.

## What are the best practices for securely managing encryption keys?

**Never commit the key.** Same pattern as the rest of the project's secrets: `ENCRYPTION_KEY` lives in `.env`, which is git-ignored; only `.env.example` (with an empty value) is tracked; and `env.validation.ts`'s zod schema makes it a required field, so the app fails to start immediately if it's missing rather than silently misbehaving later.

**Use different keys per environment.** Development and production should never share a key. If a development key leaks — which is more likely, since dev environments and local machines are generally less locked down than production — that leak shouldn't be able to compromise production data.

**Back the key up securely, deliberately.** This is different from most other secrets: an encryption key isn't like a password that can be reset if lost. The database only stores ciphertext produced with that specific key — if the key is lost with no backup, every row encrypted with it becomes permanently unrecoverable, with no "forgot password" recovery path. In production this argues for a dedicated secret manager (AWS Secrets Manager, GCP Secret Manager, etc.) with proper redundancy, rather than a key that exists only in one `.env` file on one machine.

**Understand that key rotation isn't a simple swap.** If a key is suspected to be compromised, you can't just generate a new one and drop it into `.env` — existing rows were encrypted with the old key and can only be decrypted with that same old key; the new key can't read them. Rotating a key properly means keeping the old key available, writing a migration that decrypts every existing row with the old key and re-encrypts it with the new one, and only retiring the old key once that migration has completed — a deliberate, planned operation, not a quick config change.

## What are the trade-offs between encrypting at the database level vs. the application level?

Database-level (at-rest) encryption is transparent to every query — because the database engine decrypts everything automatically for any authorized query, `WHERE`, `ORDER BY`, and indexes on any column work exactly as normal, with no extra engineering effort. Its weakness is scope: it only protects data that's physically at rest, not data reachable through a live, authorized-looking database connection.

Application-level encryption (`typeorm-encrypted`) protects against that gap — even a compromised database connection only yields ciphertext, since the decryption key never lives in the database — but it comes at a real cost to querying. The package's own README FAQ states it directly: "Queries that transform the encrypted column won't work, because transformers and subscribers operate outside of the DBMS." Concretely, a query like `WHERE ownerEmail = 'alan@test.com'` would compare the plaintext I'm searching for against the ciphertext actually stored in that column (`ZRaWuLq23734FQL7P5cdIAi6igi7ZGcIog+5X5xv+qE=`) — those never match, so the query returns zero rows even if a matching record exists. It gets worse if the IV is randomly generated per write (the safer choice, and the one I used): the same plaintext value produces different ciphertext every time it's encrypted, so even an exact ciphertext-to-ciphertext comparison wouldn't reliably find repeated values across rows. Sorting, filtering, and indexing an encrypted field at the database level essentially don't work — any of that would have to happen after decrypting rows in the application layer, which doesn't scale to large tables.

So the trade-off is: database-level encryption is broad, cheap, and query-friendly but has a narrower threat model; application-level encryption has a much stronger threat model for the specific fields it covers, but sacrifices the database's ability to search, sort, or index on those fields, and adds real engineering overhead (key management, migration handling) that a purely database-level approach doesn't require. In practice this argues for using application-level encryption selectively — only on genuinely sensitive fields that don't need to be queried directly — rather than everywhere.