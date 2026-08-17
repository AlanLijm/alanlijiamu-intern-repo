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

### Problems
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

## 💭 Reflections

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

### Problems
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

### Why this is better
- The **Strategy/Factory classes are replaced with a lookup table** (`SHIPPING_RATE_PER_KG`), since the "strategies" were really just two constant rates — no polymorphism or extensibility was actually needed. Adding a new shipping mode is now a one-line addition to the map instead of a new class plus a factory branch.
- **Guard clause** (`if (weight == null || weight < 0) return 0;`) replaces the nested if/else, making the invalid-input rule immediately visible at the top of the function.
- **Named constant map** replaces the magic numbers `2` and `5`, and documents both the rate and which mode it belongs to in one place.
- The **dead `factory` variable is removed**.
- The whole implementation is now readable in one function instead of requiring a reader to trace through five separate declarations.

## 💭 Reflections

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