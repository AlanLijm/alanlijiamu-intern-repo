# 4.6 Handling Errors & Edge Cases

## 📖 Research: Strategies for Handling Errors and Edge Cases

- **Guard clauses**: check for invalid conditions first and return/throw immediately, instead of nesting the "happy path" inside a big `if (valid) { ... }` block. This flattens the function and makes the valid conditions for proceeding explicit at the top, rather than buried in an `else`.
- **Fail fast**: validate inputs as early as possible and reject bad data at the boundary, rather than letting invalid values silently flow deeper into the system where the eventual failure is harder to trace back to its cause.
- **Use specific, typed errors**: throwing a generic `Error('something went wrong')` gives callers nothing to act on. Custom error types/classes (e.g. `InvalidInputError`, `NotFoundError`) let calling code distinguish *what* went wrong and respond appropriately (e.g. return a 404 vs a 400).
- **Never silently swallow errors**: an empty `catch {}` block hides failures instead of handling them, making bugs invisible until they cause damage somewhere else. At minimum, log the error; ideally, handle it meaningfully or re-throw it.
- **Handle edge cases explicitly, don't assume "normal" input**: empty arrays, `null`/`undefined`, zero, negative numbers, and boundary values (min/max) should be deliberately considered, not left to whatever the code happens to do by accident.
- **Distinguish expected vs unexpected errors**: expected failures (e.g. "user not found," "invalid email") are part of normal control flow and should be handled gracefully with clear messages; unexpected failures (e.g. a database connection drop) may need different handling like retries, alerts, or bubbling up to a global error handler.
- **Don't let errors leave the system in a bad state**: especially in async/multi-step operations, consider what should happen to already-completed steps if a later step fails (e.g. rolling back a partial write).

## 🧩 Example: Poor Error Handling

```typescript
function getDiscountedPrice(price, discountPercent) {
  let discount = price * (discountPercent / 100);
  let final = price - discount;
  return final;
}

function findUserOrder(orders, orderId) {
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].id === orderId) {
      return orders[i];
    }
  }
}

async function processRefund(orders, orderId) {
  const order = findUserOrder(orders, orderId);
  const refundAmount = order.total; // will crash if order is undefined
  await paymentGateway.refund(order.paymentId, refundAmount);
  return refundAmount;
}
```

### 4.6 Problems

- `getDiscountedPrice` doesn't validate its inputs: a negative `price`, a `discountPercent` over 100, or non-numeric input (e.g. `undefined`) all silently produce a nonsensical result (like a negative price) instead of failing clearly.
- `findUserOrder` returns `undefined` when no match is found, with no signal to the caller that this is a real possibility they need to handle.
- `processRefund` doesn't check whether `order` exists before using it — if the order isn't found, `order.total` throws an unhandled `TypeError: Cannot read properties of undefined`, which gives no useful information about *why* the refund failed.
- There's no distinction between "order not found" (an expected, recoverable case) and a genuine unexpected crash — both currently look like an unhandled exception with a confusing stack trace.
- If `paymentGateway.refund` fails (e.g. network error), there's no try/catch, so the caller of `processRefund` gets an unhandled rejection with no context about which step failed.

## ✨ Refactored: Guard Clauses + Explicit Error Handling

```typescript
class InvalidInputError extends Error {}
class OrderNotFoundError extends Error {}
class RefundFailedError extends Error {}

interface Order {
  id: string;
  total: number;
  paymentId: string;
}

function getDiscountedPrice(price: number, discountPercent: number): number {
  if (typeof price !== 'number' || price < 0) {
    throw new InvalidInputError('Price must be a non-negative number');
  }
  if (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 100) {
    throw new InvalidInputError('Discount percent must be between 0 and 100');
  }

  const discount = price * (discountPercent / 100);
  return price - discount;
}

function findUserOrder(orders: Order[], orderId: string): Order | null {
  return orders.find((order) => order.id === orderId) ?? null;
}

async function processRefund(orders: Order[], orderId: string): Promise<number> {
  if (!orderId) {
    throw new InvalidInputError('orderId is required');
  }

  const order = findUserOrder(orders, orderId);
  if (!order) {
    throw new OrderNotFoundError(`No order found with id: ${orderId}`);
  }

  try {
    await paymentGateway.refund(order.paymentId, order.total);
  } catch (cause) {
    throw new RefundFailedError(`Refund failed for order ${orderId}: ${cause}`);
  }

  return order.total;
}
```

### Why this is better

- **Guard clauses** at the top of `getDiscountedPrice` and `processRefund` reject invalid input immediately, so the rest of each function can assume it's working with valid data — no defensive checks scattered later in the logic.
- **`findUserOrder` returns `Order | null` instead of implicitly `undefined`**, and its return type makes the "not found" case visible in the type system, so callers can't forget to handle it without a type error.
- **Specific error types** (`InvalidInputError`, `OrderNotFoundError`, `RefundFailedError`) let calling code (e.g. an API layer) catch each case and respond appropriately — for example, mapping `OrderNotFoundError` to a 404 and `InvalidInputError` to a 400 — instead of treating every failure identically.
- **The payment gateway call is wrapped in a try/catch** that re-throws with context (which order failed and why), instead of letting a raw, unexplained rejection propagate up.
- **Edge cases are handled explicitly**: missing `orderId`, an order that doesn't exist, and a downstream payment failure are each a distinct, named path instead of one generic crash.

## 💭 4.6 Reflections

**What was the issue with the original code?**
The original functions assumed their inputs would always be valid and that every operation would succeed, so there was no code path for the cases where that assumption breaks — an order not being found, a bad discount value, or a failed refund call. This meant failures showed up as raw, unhandled exceptions (like a `TypeError` on `order.total`) rather than clear, meaningful errors, making it hard to tell *why* something failed or to distinguish an expected case (order not found) from a genuine bug.

**How does handling errors improve reliability?**
Explicit error handling means failures are anticipated and given a clear, typed identity instead of being an accident that happens to surface as a crash. This makes the system more predictable: callers can catch specific error types and decide how to respond (retry, show a message, log and alert), invalid data is rejected at the boundary before it can corrupt further logic, and when something does fail, the error message actually explains what happened and where — which makes debugging and recovery far faster than tracing back from a generic, unhandled exception.

# 4.7 Refactoring Code for Simplicity

## 📖 Research: Common Refactoring Techniques

- **Extract Function**: pull a chunk of logic out into its own well-named function, reducing the size and cognitive load of the original function (used throughout 4.3 and 4.4).
- **Replace Conditional with Polymorphism / Lookup Table**: instead of a long `if/else` or `switch` branching on a type, use a map/object keyed by that type, or (in OOP) let each type provide its own implementation. Removes repeated branching logic.
- **Decompose Conditional**: extract complex boolean expressions into a well-named function or variable (`if (isEligibleForDiscount(user, order))` instead of a long inline condition), so the *meaning* of the condition is visible instead of its raw logic.
- **Replace Magic Number/Value with Named Constant**: give unexplained literals a name that documents their purpose.
- **Remove Dead Code and Unnecessary Flags**: delete unused branches, commented-out old code, and boolean "mode" flags that just toggle between two near-duplicate code paths — these add complexity without current value.
- **Simplify Nested Conditionals with Guard Clauses**: as covered in 4.6, returning early on invalid/edge cases removes a layer of nesting for the main logic.
- **Avoid Over-Engineering (YAGNI – "You Aren't Gonna Need It")**: remove abstraction layers, configuration options, or generic frameworks built for hypothetical future needs that aren't actually required yet. Overly generic code is often *more* complex than a direct solution to the actual problem.
- **Inline unnecessary indirection**: if a function, variable, or class only wraps another one without adding meaning, removing the wrapper can simplify the code rather than complicate it — simplicity isn't just about splitting things up, it's about matching structure to actual need.

## 🧩 Example: Overly Complicated Code

```typescript
class ShippingCalculatorStrategyFactory {
  static getStrategy(mode: string) {
    if (mode === 'standard') {
      return new StandardShippingStrategy();
    } else if (mode === 'express') {
      return new ExpressShippingStrategy();
    }
    return new StandardShippingStrategy();
  }
}

interface ShippingStrategy {
  calculate(weight: number): number;
}

class StandardShippingStrategy implements ShippingStrategy {
  calculate(weight: number): number {
    return weight * 2;
  }
}

class ExpressShippingStrategy implements ShippingStrategy {
  calculate(weight: number): number {
    return weight * 5;
  }
}

function getShippingCost(weight: number, mode: string): number {
  const factory = new ShippingCalculatorStrategyFactory();
  const strategy = ShippingCalculatorStrategyFactory.getStrategy(mode);
  let cost;
  if (weight !== null && weight !== undefined) {
    if (weight >= 0) {
      cost = strategy.calculate(weight);
    } else {
      cost = 0;
    }
  } else {
    cost = 0;
  }
  return cost;
}
```

### 4.7 Problems

- A full **Strategy + Factory pattern** (two classes, an interface, and a factory) is used for what is really just two flat rate multipliers (`2` and `5`) — this is over-engineering for a problem that doesn't need runtime-swappable, extensible strategy objects.
- The unused `factory` variable in `getShippingCost` is dead code left over from a partial refactor.
- The weight validation is written as **deeply nested conditionals** (`if weight is not null/undefined { if weight >= 0 { ... } else { ... } } else { ... }`) instead of simple guard clauses, making a simple rule ("invalid or negative weight costs 0") harder to see at a glance.
- The multipliers `2` and `5` are unexplained magic numbers.
- The extra layers (interface, two classes, factory) mean a reader has to jump across four separate places just to learn that express shipping costs 5x the weight.

## ✨ Refactored: Simpler, Equivalent Code

```typescript
const SHIPPING_RATE_PER_KG: Record<string, number> = {
  standard: 2,
  express: 5,
};

function getShippingCost(weight: number, mode: string): number {
  if (weight == null || weight < 0) {
    return 0;
  }

  const ratePerKg = SHIPPING_RATE_PER_KG[mode] ?? SHIPPING_RATE_PER_KG.standard;
  return weight * ratePerKg;
}
```

### 4.7 Why this is better

- The **Strategy/Factory classes are replaced with a lookup table** (`SHIPPING_RATE_PER_KG`), since the "strategies" were really just two constant rates — no polymorphism or extensibility was actually needed. Adding a new shipping mode is now a one-line addition to the map instead of a new class plus a factory branch.
- **Guard clause** (`if (weight == null || weight < 0) return 0;`) replaces the nested if/else, making the invalid-input rule immediately visible at the top of the function.
- **Named constant map** replaces the magic numbers `2` and `5`, and documents both the rate and which mode it belongs to in one place.
- The **dead `factory` variable is removed**.
- The whole implementation is now readable in one function instead of requiring a reader to trace through five separate declarations.

## 💭 4.7 Reflections

**What made the original code complex?**
The original code was complex mainly because of over-engineering: it used a full Strategy + Factory design pattern to represent what was actually just two constant multipliers, adding four extra pieces of structure (an interface and three classes) for a problem that didn't need runtime extensibility. On top of that, the weight validation used unnecessarily nested conditionals for a simple rule, there was leftover dead code (the unused `factory` variable), and the shipping rates were unexplained magic numbers — none of which added any real value, but all of which added places a reader had to check to understand one simple calculation.

**How did refactoring improve it?**
Replacing the Strategy/Factory pattern with a plain lookup object reduced five pieces of code (interface + 2 strategy classes + factory + function) down to one small map and one function, without losing any functionality — adding a new shipping mode is now trivial. Using a guard clause instead of nested conditionals made the "invalid weight" rule readable in a single line, and naming the rate constants removed the need to guess what `2` and `5` meant. The simplified version keeps exactly the same behavior as the original but requires far less effort to read, verify, or extend — matching the principle that structure should fit the actual complexity of the problem, not a hypothetical future one.

# 4.9 Writing Unit Tests for Clean Code

## 📖 Research: Why Unit Testing Matters

- **Tests document intent**: a well-written test shows exactly what a function is supposed to do for a given input, acting as executable documentation that stays accurate (unlike comments, which can drift — see 4.5).
- **Tests enable safe refactoring**: clean code principles like extracting functions (4.3), removing duplication (4.4), and simplifying logic (4.7) all involve changing a function's internal structure. A test suite lets you make that change and immediately confirm behavior didn't break, rather than manually re-checking every case by hand.
- **Tests push code toward better design**: functions that are hard to unit test (e.g. they depend on a live database, a network call, or global state) are often a sign the function is doing too much or is too tightly coupled — the same "long function" / "god object" smells from 4.8. Writing tests naturally pressures code toward small, pure, single-responsibility functions.
- **Tests catch edge cases early**: deliberately writing tests for boundary values (zero, negative numbers, empty arrays, invalid input) surfaces the same edge-case gaps discussed in 4.6, often before the code ever reaches production.
- **Fast feedback loop**: a unit test runs in milliseconds and can be run on every save, catching regressions far earlier (and cheaper to fix) than a manual test or a bug report from a user.

## 🛠 Framework Chosen: Jest

Jest was chosen since the onboarding repo (`onboarding-backend-nest-js`) is a NestJS/TypeScript project, and Jest is NestJS's default testing framework (bundled with the standard Nest CLI project setup).

## 🧩 Function Under Test

Reusing `getShippingCost` from Milestone 4.7 (Refactoring for Simplicity):

```typescript
const SHIPPING_RATE_PER_KG: Record<string, number> = {
  standard: 2,
  express: 5,
};

function getShippingCost(weight: number, mode: string): number {
  if (weight == null || weight < 0) {
    return 0;
  }

  const ratePerKg = SHIPPING_RATE_PER_KG[mode] ?? SHIPPING_RATE_PER_KG.standard;
  return weight * ratePerKg;
}
```

## ✅ Unit Tests

```typescript
import { getShippingCost } from './shipping';

describe('getShippingCost', () => {
  it('calculates standard shipping at 2x weight', () => {
    expect(getShippingCost(10, 'standard')).toBe(20);
  });

  it('calculates express shipping at 5x weight', () => {
    expect(getShippingCost(10, 'express')).toBe(50);
  });

  it('returns 0 for negative weight', () => {
    expect(getShippingCost(-5, 'standard')).toBe(0);
  });

  it('returns 0 for null or undefined weight', () => {
    expect(getShippingCost(null as unknown as number, 'standard')).toBe(0);
    expect(getShippingCost(undefined as unknown as number, 'standard')).toBe(0);
  });

  it('returns 0 for zero weight', () => {
    expect(getShippingCost(0, 'standard')).toBe(0);
  });

  it('falls back to the standard rate for an unknown mode', () => {
    expect(getShippingCost(10, 'overnight-drone')).toBe(20);
  });

  it('falls back to the standard rate when mode is an empty string', () => {
    expect(getShippingCost(10, '')).toBe(20);
  });
});
```

## 💭 Reflections

**How do unit tests help keep code clean?**
Writing these tests confirmed that `getShippingCost` is a small, pure function — no database, no network call, no shared state — which made it trivial to test every case with a plain function call and an assertion. That's a direct result of the earlier refactors (4.3, 4.7): a messier, tangled version of this function (mixed with I/O, or buried inside a larger function) would have been much harder to test in isolation. In that sense, the tests didn't just verify the clean code — writing them retroactively confirms *why* the earlier refactoring toward small, single-purpose functions was worth doing: it's what made fast, isolated testing possible at all.

**What issues did you find while testing?**
Writing the zero-weight case (`getShippingCost(0, 'standard')`) exposed a subtle edge case worth double-checking: the guard clause only checks `weight == null || weight < 0`, so `0` correctly falls through to the calculation and returns `0 * 2 = 0` — the right answer, but for a different reason than the null/negative guard. It's easy to assume "0 is falsy so it's caught by the guard," which isn't actually true here, and a less careful implementation could have accidentally rejected valid zero-weight orders (e.g. a free digital add-on) if the guard clause had used `!weight` instead of the explicit `== null` check. Writing an explicit test for this case makes that behavior intentional and protected against future regressions, rather than accidentally correct.

# 4.10 Code Formatting & Style Guides

## 📖 Research: Why Consistent Code Style Matters

- **Removes bikeshedding**: without an enforced style, developers spend time debating tabs vs spaces, quote style, or where to put a brace — decisions with no real impact on correctness. A style guide + automated enforcement settles these once, for the whole team.
- **Makes diffs meaningful**: when formatting is inconsistent, a small logic change can produce a noisy diff full of unrelated whitespace/quote changes, making code review harder and hiding the actual change. Consistent formatting keeps diffs focused on real changes.
- **Lowers the cost of reading unfamiliar code**: everyone benefits when every file "looks the same" — a reader doesn't need to adjust to each author's personal style when moving between files.
- **Catches real bugs, not just style**: linters (like ESLint) don't just format — rules like `no-unused-vars` and `eqeqeq` catch actual mistakes (dead code, loose-equality bugs) before they cause problems.
- **Automation removes human error and friction**: manually enforcing style during code review is slow and inconsistent between reviewers. A formatter (Prettier) and linter (ESLint) run automatically, catching issues before a human reviewer even looks at the code.

## 📚 Airbnb JavaScript Style Guide — Key Points Reviewed

The [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) is one of the most widely adopted style guides in the JS/TS ecosystem. Notable conventions relevant to this project:

- Prefer `const` over `let`, and never use `var` — avoids accidental reassignment and scoping bugs.
- Always use `===`/`!==` instead of `==`/`!=` to avoid type-coercion bugs (with `== null` commonly allowed as an intentional shorthand for "null or undefined").
- Use template literals (`` `Hello ${name}` ``) instead of string concatenation.
- Always use braces for multi-line blocks, with consistent brace placement.
- No unused variables — an unused import or variable is treated as an error, not a warning.

These conventions connect back to earlier milestones — e.g. `===`/`== null` ties to 4.6's point about handling edge cases explicitly, and "no unused variables" is the same dead-code smell from 4.8.

## 🛠 Installing & Configuring ESLint + Prettier

The onboarding repo (`onboarding-backend-nest-js`) turned out to be a milestone-based practice repo rather than a running NestJS service — it has no `src` folder, `tsconfig.json`, or Nest CLI scaffolding. Setup was done from scratch, and the process surfaced several real compatibility issues along the way (documented below rather than glossed over, since working through them was itself part of the exercise).

**Install dependencies:**

```powershell
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev @eslint/js@8.57.1 globals
```

(`eslint-config-airbnb-base` and `eslint-plugin-import` were installed initially to follow the Airbnb guide directly, but were dropped — Airbnb's config doesn't yet support ESLint's flat config format, so `@typescript-eslint/recommended` was used instead as a widely-adopted equivalent, applying the same Airbnb conventions reviewed above as manual rules.)

**`eslint.config.mjs`** (flat config — required because this project uses ESLint 8.57.1, where flat config exists but isn't the default the way it is in ESLint 9+):

```javascript
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
  prettierConfig, // must be last: turns off ESLint style rules that conflict with Prettier
];
```

**`.prettierrc`:**

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

**Running lint** (ESLint 8.57.1 needs an explicit environment variable to use flat config):

```powershell
$env:ESLINT_USE_FLAT_CONFIG="true"; npx eslint "milestone4 clean code/lint-demo.ts"
$env:ESLINT_USE_FLAT_CONFIG="true"; npx eslint "milestone4 clean code/lint-demo.ts" --fix
```

## 🧩 What Actually Happened: Before → After

**Before (`lint-demo.ts`):**

```typescript
var userName = "Alan"
let unusedVar = 5

function calculateTax(price) {
  return price * 0.0825
}

function greet(name) {
  if (name == null) {
    return 'Hello, stranger'
  }
  else {
    return "Hello, " + name
  }
}
```

**First lint run — 18 problems:**

- 14 Prettier formatting errors — mostly stray `␍` characters (Windows CRLF line endings not matching the project's expected line endings), plus missing semicolons and inconsistent quote style.
- 4 real `@typescript-eslint/no-unused-vars` errors — `userName`, `unusedVar`, `calculateTax`, and `greet` were all declared but never used anywhere.

**After `eslint --fix`:** all 14 formatting issues were resolved automatically. The 4 unused-variable errors were correctly left untouched — ESLint won't guess whether an unused declaration should be deleted or actually used, so that's a decision for a human.

**After (manually resolved, then re-formatted):**

```typescript
const userName = 'Alan';

function calculateTax(price: number): number {
  return price * 0.0825;
}

function greet(name: string | null): string {
  if (name == null) {
    return 'Hello, stranger';
  } else {
    return `Hello, ${name}`;
  }
}

console.log(userName, calculateTax(100), greet(userName));
```

Final lint run: **0 problems.**

## 💭4.10 Reflections

**Why is code formatting important?**
Consistent formatting keeps code review and diffs focused on real logic changes instead of whitespace or quote-style noise. It also removes decisions individual developers would otherwise make inconsistently (tabs vs spaces, quote style) — the tool decides once, for everyone, instead of relying on each contributor remembering the convention.

**What issues did the linter detect?**
The first run found 18 problems: 14 were Prettier formatting issues (mostly CRLF line-ending mismatches from Windows, plus missing semicolons and quote style), and 4 were genuine no-unused-vars errors for declarations that were never called anywhere in the file. eslint --fix cleared all 14 formatting issues automatically but correctly left the 4 unused-variable errors for manual review, since only a human can decide whether an unused declaration is dead code to delete or something that should actually be used.

Fixing those 4 manually also surfaced a real bug: I first wrote return 'Hello, ${name}'; with single quotes instead of backticks, so the ${name} interpolation wouldn't actually have worked at runtime — it would have printed the literal text ${name} rather than the value of name. This was caught through manual code review, not by ESLint or Prettier. I confirmed this directly by reverting the line to the single-quote version and re-running the linter: it reported only a cosmetic quote-style suggestion ('Hello, ${name}' → "Hello, ${name}") with no indication that the interpolation was broken, since the line is syntactically valid — the tool has no way to know ${name} was meant to be evaluated. This confirmed that linting/formatting checks syntax and style, not intent, and doesn't substitute for actually reading (or testing) the logic — it complements testing (4.9) rather than replacing it.

Setting this up on Windows with this project's ESLint version also surfaced two environment-specific issues: ESLint 8.57.1 doesn't default to flat config, so every run needed ESLINT_USE_FLAT_CONFIG=true set first; and flat config doesn't automatically know about Node/Jest globals (like console) the way the older .eslintrc.js's env: { node: true } option did, which needed the globals package and an explicit languageOptions.globals entry.

**Did formatting the code make it easier to read?**
 Yes — the file went from mixed line endings, inconsistent quotes, and unused, dead-looking declarations to a short, consistently formatted file where every value is actually used and its purpose is clear. The process also caught a genuine logic bug (the wrong quote type breaking string interpolation) that would likely have been missed on a casual read, reinforcing that the setup effort for linting/formatting pays off even on a small file.
 