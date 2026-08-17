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