# 4.8 Identifying & Fixing Code Smells

## 📖 Research: Common Code Smells and Their Impact

A "code smell" isn't a bug — the code still works — but it's a surface-level signal that the underlying design has a problem that will likely cause pain later: harder debugging, higher risk when changing code, and slower onboarding for new developers. Smells matter because they compound: a codebase with many small smells becomes disproportionately harder to work in than the sum of its individual issues, since problems interact (e.g. duplicated code inside a long function inside a god object). Below are the seven smells covered here, with a "before" example, a fix, and why the fix helps.

---

## 1. Magic Numbers & Strings

**Smell:**

```typescript
function calculateTax(price: number): number {
  return price * 0.0825; // what does this number mean?
}

if (user.role === 'A') {
  grantAdminAccess();
}
```

**Fix:**

```typescript
const SALES_TAX_RATE = 0.0825;

function calculateTax(price: number): number {
  return price * SALES_TAX_RATE;
}

enum UserRole {
  Admin = 'A',
}

if (user.role === UserRole.Admin) {
  grantAdminAccess();
}
```

Named constants and enums document what a literal *means*, and centralize the value so it only needs to change in one place.

---

## 2. Long Functions

**Smell:**

```typescript
async function registerUser(data: any) {
  if (!data.email.includes('@')) throw new Error('bad email');
  if (data.password.length < 8) throw new Error('weak password');
  const hashed = await bcrypt.hash(data.password, 10);
  const user = await db.collection('users').insertOne({ ...data, password: hashed });
  await emailClient.send({ to: data.email, subject: 'Welcome', body: 'Thanks for joining!' });
  await analytics.track('user_registered', { userId: user.insertedId });
  return user;
}
```

**Fix:**

```typescript
function validateRegistration(data: RegistrationData): void {
  if (!data.email.includes('@')) throw new Error('bad email');
  if (data.password.length < 8) throw new Error('weak password');
}

async function createUserRecord(data: RegistrationData) {
  const hashed = await bcrypt.hash(data.password, 10);
  return db.collection('users').insertOne({ ...data, password: hashed });
}

async function registerUser(data: RegistrationData) {
  validateRegistration(data);
  const user = await createUserRecord(data);
  await emailClient.send({ to: data.email, subject: 'Welcome', body: 'Thanks for joining!' });
  await analytics.track('user_registered', { userId: user.insertedId });
  return user;
}
```

Splitting validation and persistence into named functions makes `registerUser` read as a short list of steps (see 4.3 for the full technique).

---

## 3. Duplicate Code

**Smell:**

```typescript
function formatUserName(user: { first: string; last: string }) {
  return user.first.trim() + ' ' + user.last.trim();
}

function formatAuthorName(author: { first: string; last: string }) {
  return author.first.trim() + ' ' + author.last.trim();
}
```

**Fix:**

```typescript
function formatFullName(person: { first: string; last: string }): string {
  return `${person.first.trim()} ${person.last.trim()}`;
}
```

One shared function instead of two identical ones — a formatting change now only needs to happen once (see 4.4 for the full DRY discussion).

---

## 4. Large Classes (God Objects)

**Smell:**

```typescript
class UserManager {
  createUser(data: any) { /* ... */ }
  deleteUser(id: string) { /* ... */ }
  sendWelcomeEmail(user: any) { /* ... */ }
  sendPasswordResetEmail(user: any) { /* ... */ }
  generateInvoicePdf(user: any) { /* ... */ }
  calculateUserLoyaltyPoints(user: any) { /* ... */ }
  logUserActivity(user: any, action: string) { /* ... */ }
}
```

**Fix:**

```typescript
class UserRepository {
  createUser(data: UserData) { /* ... */ }
  deleteUser(id: string) { /* ... */ }
}

class UserEmailService {
  sendWelcomeEmail(user: User) { /* ... */ }
  sendPasswordResetEmail(user: User) { /* ... */ }
}

class InvoiceService {
  generateInvoicePdf(user: User) { /* ... */ }
}

class LoyaltyService {
  calculateUserLoyaltyPoints(user: User) { /* ... */ }
}

class ActivityLogger {
  logUserActivity(user: User, action: string) { /* ... */ }
}
```

`UserManager` was handling persistence, email, invoicing, loyalty, and logging — five unrelated responsibilities in one class. Splitting by responsibility means each class has one reason to change, and can be tested and understood independently.

---

## 5. Deeply Nested Conditionals

**Smell:**

```typescript
function getShippingLabel(order: any) {
  if (order) {
    if (order.address) {
      if (order.address.country === 'AU') {
        if (order.weight <= 20) {
          return 'domestic-standard';
        } else {
          return 'domestic-heavy';
        }
      } else {
        return 'international';
      }
    }
  }
  return 'unknown';
}
```

**Fix:**

```typescript
function getShippingLabel(order: Order | null): string {
  if (!order?.address) return 'unknown';
  if (order.address.country !== 'AU') return 'international';
  return order.weight <= 20 ? 'domestic-standard' : 'domestic-heavy';
}
```

Guard clauses flatten four levels of nesting into a linear sequence of checks, so the reader doesn't need to hold multiple open conditions in their head at once (see 4.6/4.7).

---

## 6. Commented-Out Code

**Smell:**

```typescript
function calculateTotal(items: Item[]): number {
  // old version, kept in case new version breaks
  // let total = 0;
  // for (let i = 0; i < items.length; i++) {
  //   total += items[i].price;
  // }
  // return total;

  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Fix:**

```typescript
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

Commented-out code adds clutter and creates doubt about whether it's still needed. Version control (git history) already preserves the old implementation, so it can be safely deleted — there's no need to keep a dead copy inline.

---

## 7. Inconsistent Naming

**Smell:**

```typescript
function getUsr(id: string) { /* ... */ }
function fetchCustomerRecord(id: string) { /* ... */ }
function retrieve_account(id: string) { /* ... */ }
```

**Fix:**

```typescript
function getUser(id: string) { /* ... */ }
function getCustomer(id: string) { /* ... */ }
function getAccount(id: string) { /* ... */ }
```

Three functions doing the same kind of operation (fetch a single record by id) used three different verbs (`get`/`fetch`/`retrieve`), an abbreviation (`Usr`), and a mismatched naming case (`snake_case` vs `camelCase`). Standardizing on one verb and one casing convention makes the API predictable — a developer can guess the name of a new "get by id" function without checking docs.

---

## 💭 Reflections

**What code smells did you find in your code?**
Across the examples above I identified all seven target smells: magic numbers/strings (unexplained tax rate and role code), a long function mixing validation/persistence/email/analytics in one place, duplicated name-formatting logic across two nearly identical functions, a god object (`UserManager`) handling five unrelated responsibilities, a four-level-deep nested conditional for shipping labels, stale commented-out code left alongside its replacement, and inconsistent naming (`getUsr`/`fetchCustomerRecord`/`retrieve_account`) for functions that do the same kind of thing.

**How did refactoring improve the readability and maintainability of the code?**
Each fix reduced the amount a reader has to hold in their head at once: named constants replaced unexplained literals, the long function became a short sequence of named steps, duplicate logic became a single shared function, the god object split into focused single-responsibility classes, nested conditionals flattened into guard clauses, dead commented code was removed entirely, and naming became predictable across similar functions. In every case the resulting code does the same thing with less code to read and fewer places that could silently drift out of sync with each other.

**How can avoiding code smells make future debugging easier?**
When responsibilities are separated (no god objects, no long functions mixing concerns), a bug can be traced to a specific, narrow piece of code instead of requiring the developer to untangle a large function or class to find which part is misbehaving. Eliminating duplication means a fix only needs to be applied once instead of being replicated across every copy (and no risk of "fixed it in one place, forgot the other"). Flattened conditionals and consistent naming make it faster to read code correctly the first time, reducing the chance of misunderstanding the logic mid-debugging. Overall, less accumulated smell means less friction between "something is broken" and "I understand why."
