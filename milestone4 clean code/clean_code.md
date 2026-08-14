# Clean Code Principles

##  Purpose
This document summarizes the core principles of clean code and demonstrates them with a before/after refactoring example, as part of Milestone 4.1 (Understanding Clean Code Principles).

##  Core Principles

### 1. Simplicity
Code should do what it needs to do in the most straightforward way possible. Avoid clever one-liners, unnecessary abstraction layers, or over-engineered solutions for simple problems. Simple code is easier to reason about, easier to test, and less likely to hide bugs.

### 2. Readability
Code is read far more often than it is written. Variable, function, and class names should clearly express intent (`getUserById` instead of `getData`). Functions should be short and do one thing. Nesting and complex conditionals should be flattened where possible so a reader can follow the logic top to bottom without holding too much state in their head.

### 3. Maintainability
Code should be written so that someone else — or "future you" six months from now — can safely change it. This means favoring small, single-responsibility functions/classes, minimizing tight coupling between modules, and avoiding duplicated logic that would need to be updated in multiple places.

### 4. Consistency
Following a shared style guide (naming conventions, file structure, formatting, linting rules) makes a codebase predictable. When every file "looks the same," developers can move between parts of the project without re-learning local conventions. In a team project like this one, consistency matters more than any individual's personal preference.

### 5. Efficiency
Code should be performant enough for its use case, but this should not come at the cost of readability unless there's a measured, real performance problem. Premature optimization often makes code harder to understand for a gain that may never matter. The rule of thumb: make it correct and clear first, then optimize where profiling shows it's actually needed.

##  Example: Messy Code

The snippet below (a typical NestJS-style service method) is a realistic example of messy code:

```typescript
async function proc(u: any, d: any) {
  let r;
  if (u.type == 1) {
    if (d.amt > 0) {
      if (u.status == 'active') {
        r = d.amt * 0.9;
      } else {
        r = d.amt;
      }
    } else {
      r = 0;
    }
  } else if (u.type == 2) {
    if (d.amt > 0) {
      if (u.status == 'active') {
        r = d.amt * 0.8;
      } else {
        r = d.amt;
      }
    } else {
      r = 0;
    }
  }
  return r;
}
```

### Why this is hard to read
- **Meaningless names**: `proc`, `u`, `d`, `r` give no clue about what the function does or what the data represents.
- **`any` types**: there's no type safety, so a reader (and the compiler) can't tell what shape `u` and `d` actually have.
- **Deep nesting**: three levels of `if` statements force the reader to track multiple conditions simultaneously.
- **Duplicated logic**: the `type == 1` and `type == 2` branches are nearly identical except for the discount rate — a classic sign the logic should be unified.
- **Magic numbers**: `0.9`, `0.8`, and `1`/`2` for user type have no explanation of what they mean.
- **No single responsibility**: the function mixes discount-rate lookup, validation (`amt > 0`), and calculation all in one place.

##  Rewritten: Clean Version

```typescript
interface User {
  membershipTier: MembershipTier;
  status: 'active' | 'inactive';
}

interface Order {
  amount: number;
}

enum MembershipTier {
  Standard = 1,
  Premium = 2,
}

const DISCOUNT_RATE_BY_TIER: Record<MembershipTier, number> = {
  [MembershipTier.Standard]: 0.1,
  [MembershipTier.Premium]: 0.2,
};

function calculateOrderTotal(user: User, order: Order): number {
  if (order.amount <= 0) {
    return 0;
  }

  if (user.status !== 'active') {
    return order.amount;
  }

  const discountRate = DISCOUNT_RATE_BY_TIER[user.membershipTier];
  return order.amount * (1 - discountRate);
}
```

### Why this is cleaner
- **Descriptive names**: `calculateOrderTotal`, `user`, `order` immediately convey intent.
- **Typed interfaces/enum**: `User`, `Order`, and `MembershipTier` give the compiler (and the reader) a clear contract instead of `any`.
- **No duplicated branches**: the discount lookup is data-driven (`DISCOUNT_RATE_BY_TIER`), so adding a new tier means adding one entry, not a new `if` branch.
- **Early returns instead of nesting**: guard clauses (`amount <= 0`, `status !== 'active'`) flatten the logic to a single level.
- **Named constants instead of magic numbers**: discount rates are documented by the map they live in rather than bare literals scattered through the code.

##  Summary
Applying simplicity, readability, maintainability, consistency, and efficiency turned a nested, duplicated, untyped function into a short, self-documenting one — with the same behavior but far less risk when someone (including future me) needs to change it later.


# 4.2 Naming Variables & Functions
 Best Practices Researched
Be descriptive, not clever: a name should say what a variable holds or what a function does, without needing a comment to explain it (activeUserCount beats cnt).
Use intention-revealing names: daysSinceLastLogin tells the reader why the value exists, not just its type.
Avoid abbreviations and single letters outside of tiny, obvious scopes (e.g. i in a short loop is fine; usr, msg, tmp for anything long-lived is not).
Functions should read like verbs, variables like nouns: calculateTotalPrice() vs totalPrice. A function name should describe the action/result it performs.
Boolean names should read as yes/no questions: isActive, hasPermission, canRetry — not flag or status.
Avoid misleading names: a name shouldn't imply a type, unit, or behavior it doesn't have (e.g. don't call something userList if it's actually a Map).
Consistent vocabulary: pick one word per concept across the codebase (don't mix fetch, get, and retrieve for the same kind of operation) — this ties back to the Consistency principle from 4.1.
Length should match scope: short names are fine for variables used within a few lines (e.g. loop counters); names visible across a wider scope (class fields, exported functions) should be more descriptive since readers have less surrounding context.
 Example: Unclear Names
typescript
function calc(a: number, b: number, t: string): number {
  let x;
  if (t === 'p') {
    x = a * (b / 100);
  } else {
    x = a - b;
  }
  return x;
}

const y = calc(200, 15, 'p');
Problems
calc, a, b, t, x, y give no indication of what's being calculated, what the inputs mean, or what 'p' represents.
The caller (calc(200, 15, 'p')) is unreadable without opening the function — you can't tell if 200 is a price, a quantity, or something else.
The 'p' string is a magic value with no defined meaning (a stringly-typed flag instead of a real type).
 Refactored: Clear Names
typescript
type DiscountType = 'percentage' | 'flat';

function calculateDiscountedPrice(
  originalPrice: number,
  discountValue: number,
  discountType: DiscountType,
): number {
  if (discountType === 'percentage') {
    return originalPrice * (discountValue / 100);
  }
  return originalPrice - discountValue;
}

const discountedPrice = calculateDiscountedPrice(200, 15, 'percentage');

Now the function name states exactly what it computes, each parameter name states what it represents, and discountType is a real union type instead of an unexplained string.

 Reflections

What makes a good variable or function name? A good name lets a reader understand what the code does without reading its implementation. It's specific enough to distinguish it from similar things in the codebase, matches the vocabulary used elsewhere in the project, and (for functions) reads like a description of the action being performed.

What issues can arise from poorly named variables? Poor names slow down everyone who touches the code later, including the original author. They force readers to trace through logic just to figure out what a value represents, make code review harder (reviewers can't tell if a name matches its use), increase the chance of misuse (passing the wrong value because its purpose wasn't clear), and make bugs easier to introduce during refactors since it's not obvious what depends on what.

How did refactoring improve code readability? After renaming, the function signature alone (calculateDiscountedPrice(originalPrice, discountValue, discountType)) explains what the function does and what each argument means — no need to read the function body or the call site's surrounding context. Replacing the 'p' magic string with a DiscountType union also means the compiler now catches invalid values, turning a naming improvement into a small correctness improvement as well.

# 4.3 Writing Small, Focused Functions
 Best Practices Researched
Single Responsibility Principle (function-level): a function should do one thing and do it well. If you need "and" to describe what it does (e.g. "validates the order and calculates the total and sends an email"), it should probably be three functions.
One level of abstraction per function: don't mix high-level orchestration (e.g. "process the order") with low-level details (e.g. manually formatting a date string) in the same function body.
Small enough to name precisely: if a good, specific name is hard to come by, that's often a sign the function is doing too much.
Extract, don't just comment: a block of code preceded by a comment like // calculate shipping cost is usually a signal that block should be its own function (calculateShippingCost()) — the comment becomes the function name.
Prefer pure functions where possible: functions that take inputs and return outputs without touching shared/external state are easier to test and reason about in isolation.
Limit function length as a smell, not a hard rule: there's no magic line count, but if a function no longer fits on one screen or has more than 2–3 levels of nesting, it's a candidate for splitting.
Compose small functions instead of duplicating logic: once responsibilities are split out, they can be reused and tested independently.
 Example: Long, Complex Function
typescript
async function handleOrderSubmission(orderData: any): Promise<any> {
  // validate input
  if (!orderData.items || orderData.items.length === 0) {
    throw new Error('Order must have at least one item');
  }
  if (!orderData.customerEmail || !orderData.customerEmail.includes('@')) {
    throw new Error('Invalid customer email');
  }

  // calculate total
  let total = 0;
  for (const item of orderData.items) {
    total += item.price * item.quantity;
  }
  if (orderData.couponCode) {
    if (orderData.couponCode === 'SAVE10') {
      total = total * 0.9;
    } else if (orderData.couponCode === 'SAVE20') {
      total = total * 0.8;
    }
  }

  // save to database
  const order = { ...orderData, total, createdAt: new Date() };
  const savedOrder = await db.collection('orders').insertOne(order);

  // send confirmation email
  const emailBody = `Hi, your order total is $${total.toFixed(2)}. Thank you!`;
  await emailClient.send({
    to: orderData.customerEmail,
    subject: 'Order Confirmation',
    body: emailBody,
  });

  return savedOrder;
}
Problems
One function handles four unrelated responsibilities: validation, price calculation, persistence, and notification.
It mixes abstraction levels — low-level string formatting for the email sits next to a database call and business validation.
It's hard to test: to test the discount math, you'd also need a working database and email client, since none of it can run in isolation.
It's hard to reuse: if another part of the app needs "calculate order total with coupon," that logic is trapped inside this function.
 Refactored: Small, Focused Functions
typescript
interface OrderItem {
  price: number;
  quantity: number;
}

interface OrderData {
  items: OrderItem[];
  customerEmail: string;
  couponCode?: string;
}

const COUPON_DISCOUNTS: Record<string, number> = {
  SAVE10: 0.1,
  SAVE20: 0.2,
};

function validateOrder(orderData: OrderData): void {
  if (!orderData.items || orderData.items.length === 0) {
    throw new Error('Order must have at least one item');
  }
  if (!orderData.customerEmail || !orderData.customerEmail.includes('@')) {
    throw new Error('Invalid customer email');
  }
}

function calculateOrderTotal(orderData: OrderData): number {
  const subtotal = orderData.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const discountRate = orderData.couponCode
    ? COUPON_DISCOUNTS[orderData.couponCode] ?? 0
    : 0;
  return subtotal * (1 - discountRate);
}

async function saveOrder(orderData: OrderData, total: number) {
  const order = { ...orderData, total, createdAt: new Date() };
  return db.collection('orders').insertOne(order);
}

async function sendOrderConfirmationEmail(email: string, total: number) {
  await emailClient.send({
    to: email,
    subject: 'Order Confirmation',
    body: `Hi, your order total is $${total.toFixed(2)}. Thank you!`,
  });
}

async function handleOrderSubmission(orderData: OrderData) {
  validateOrder(orderData);
  const total = calculateOrderTotal(orderData);
  const savedOrder = await saveOrder(orderData, total);
  await sendOrderConfirmationEmail(orderData.customerEmail, total);
  return savedOrder;
}

handleOrderSubmission now reads like a table of contents for the whole process, and each step can be tested, reused, or changed independently.

 Reflections

Why is breaking down functions beneficial? Small, single-purpose functions are easier to test in isolation (e.g. calculateOrderTotal can be unit-tested with plain data, no database or email client needed), easier to reuse elsewhere in the app, and easier to reason about since each one only has one job to hold in your head at a time. They also make code review faster — a reviewer can check "does validateOrder correctly validate?" without also tracing through persistence and email logic.

How did refactoring improve the structure of the code? The top-level handleOrderSubmission function turned into a short, readable sequence of clearly named steps (validate → calculate → save → notify), instead of one long block mixing all four concerns. Each extracted function now operates at a single level of abstraction, so a reader can drill into whichever step they care about instead of parsing the entire flow at once. It also made the coupon logic (calculateOrderTotal) independently reusable and testable, which wasn't possible when it was buried inside the larger function.

# 4.4 Avoiding Code Duplication (DRY)
 Research: The DRY Principle

"Don't Repeat Yourself" means every piece of knowledge or logic should have a single, unambiguous representation in the codebase. Duplication isn't just about identical lines of code — it's about the same decision or rule being expressed in more than one place. Key points from research:

Duplication multiplies maintenance cost: if a business rule (e.g. a discount calculation or a validation rule) is copy-pasted in three places, fixing a bug means finding and updating all three — and it's easy to miss one, leaving inconsistent behavior.
Duplication isn't always literal copy-paste: two functions that look different but encode the same rule (e.g. two separate age-eligibility checks with slightly different syntax) are still a DRY violation.
The fix is usually extraction, not just deletion: pull the shared logic into a single function, class, constant, or shared module, and have all call sites use it.
DRY has a limit: forcing two pieces of code together just because they currently look similar — when they represent unrelated rules that happen to coincide — can create a false, brittle abstraction. DRY applies to genuinely shared knowledge, not superficially similar code.

 Example: Duplicated Code
typescript
function validateNewUser(user: { email: string; age: number }) {
  if (!user.email || !user.email.includes('@')) {
    throw new Error('Invalid email address');
  }
  if (user.age < 0 || user.age > 120) {
    throw new Error('Invalid age');
  }
}

function validateUserUpdate(user: { email: string; age: number }) {
  if (!user.email || !user.email.includes('@')) {
    throw new Error('Invalid email address');
  }
  if (user.age < 0 || user.age > 120) {
    throw new Error('Invalid age');
  }
}

function validateGuestCheckoutUser(user: { email: string; age: number }) {
  if (!user.email || !user.email.includes('@')) {
    throw new Error('Invalid email address');
  }
  if (user.age < 0 || user.age > 120) {
    throw new Error('Invalid age');
  }
}
Problems
The exact same email and age validation rules are copy-pasted across three functions.
If the email validation rule needs to change (e.g. switch to a proper regex or a library), it has to be updated in three separate places — and a future change is likely to only touch one or two of them by mistake, creating inconsistent validation behavior across the app.
More duplicate call sites will likely be added over time (e.g. validateAdminUser), compounding the problem.
 Refactored: Shared Validation Logic
typescript
interface ValidatableUser {
  email: string;
  age: number;
}

function validateEmail(email: string): void {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }
}

function validateAge(age: number): void {
  if (age < 0 || age > 120) {
    throw new Error('Invalid age');
  }
}

function validateUser(user: ValidatableUser): void {
  validateEmail(user.email);
  validateAge(user.age);
}

// All three call sites now share one implementation:
function validateNewUser(user: ValidatableUser) {
  validateUser(user);
}

function validateUserUpdate(user: ValidatableUser) {
  validateUser(user);
}

function validateGuestCheckoutUser(user: ValidatableUser) {
  validateUser(user);
}

The validation rule now exists in exactly one place (validateEmail / validateAge), and every caller reuses it instead of re-implementing it.

 Reflections

What were the issues with duplicated code? The duplicated validation logic meant the same business rule was defined three times instead of once. This made the code harder to maintain (any rule change required editing every copy), increased the risk of the copies silently drifting apart (e.g. one call site getting updated while another is forgotten), and made the codebase larger and noisier than necessary for no real benefit.

How did refactoring improve maintainability? After extracting validateEmail and validateAge into shared functions, there's now a single source of truth for each rule. A future change — such as tightening the email format check — only needs to happen in one place and automatically applies everywhere it's used. It also makes the intent clearer: validateUser reads as "run the standard user validation," rather than requiring the reader to compare three near-identical blocks to confirm they actually do the same thing.

# 4.5 Commenting & Documentation
 Best Practices Researched
Comments explain why, not what: the code itself should say what it does (via good naming and structure); comments are for context the code can't express — intent, trade-offs, business reasons, or warnings about non-obvious behavior.
A needed comment is sometimes a refactoring signal: if a block of code needs a comment like // check if user can checkout, that's often a sign the block should become a function named canUserCheckout() instead — the name replaces the comment.
Avoid redundant comments: comments that just restate the code (// increment i by 1 above i++) add noise without adding information, and they rot — they don't get updated when the code changes, so they become actively misleading.
Document public APIs, not every line: exported functions, classes, and modules that other developers will call without reading their internals benefit from doc comments (e.g. JSDoc/TSDoc) describing parameters, return values, and edge cases. Private, obvious internal code usually doesn't need it.
Warn about non-obvious behavior: comments are valuable for flagging things a reader wouldn't expect — a workaround for a library bug, a deliberately unusual algorithm choice, a // TODO for known technical debt, or a note about a side effect.
Keep comments close to and consistent with the code: a comment far from the code it describes, or one that contradicts the code, is worse than no comment — readers tend to trust comments over code and get misled.
README / module-level docs matter for onboarding: while inline comments explain local details, higher-level documentation (README, architecture notes) is what lets a new developer understand a module's purpose before diving into individual functions.

Example: Poor Commenting
typescript
// function to process data
function proc(arr: number[]): number {
  let t = 0; // total
  for (let i = 0; i < arr.length; i++) {
    // add to total
    t += arr[i];
  }
  // return the total
  return t;
}

// this is a discount, dont change unless told to
// old logic from before, might be wrong
function getDisc(p: number): number {
  return p * 0.85; // 15% off
}

Problems
The comments on proc just restate the code line by line (// add to total above t += arr[i]) — they add no information a reader couldn't already see, and they'd need to be manually kept in sync with any future change.
The comment on proc (// function to process data) is vague and doesn't say what processing happens — a reader still has to read the implementation to learn it just sums an array.
getDisc's comments hint at important context ("might be wrong", "don't change unless told to") but don't explain why — who told them, what the correct rate should be, or what would break if changed. This is a warning sign without enough information to act on it.
The 15% comment restates the literal 0.85 instead of explaining why the discount is 15% (e.g. is it a seasonal promotion? a loyalty tier?).
 Rewritten: Clear Naming + Purposeful Comments
typescript
/**
 * Sums all values in the given array.
 */
function sumValues(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Applies the standard loyalty-tier discount (15%).
 *
 * NOTE: This rate is set by the Marketing team's Q3 promotion
 * (see ticket MKT-482) and is intentionally hardcoded until the
 * promotions service (planned for Q4) replaces it.
 */
function applyLoyaltyDiscount(price: number): number {
  const LOYALTY_DISCOUNT_RATE = 0.15;
  return price * (1 - LOYALTY_DISCOUNT_RATE);
}
Why this is better
sumValues and applyLoyaltyDiscount are self-explanatory from their names alone — the line-by-line "what" comments are no longer needed because the code (plus a short doc comment) already says what happens.
The doc comment on sumValues documents its public contract in one line, useful to anyone calling it without reading the body.
The comment on applyLoyaltyDiscount now explains why the rate is 15% and why it's hardcoded (ties to a real ticket and a planned follow-up), instead of a vague "don't touch this" warning with no context.
LOYALTY_DISCOUNT_RATE as a named constant removes the need for a comment translating 0.85 into "15% off."
 Reflections

When should you add comments? 
Add a comment when the code cannot fully express something a reader needs to know: the why behind a decision (e.g. a business rule, a ticket reference, a deliberate trade-off), a warning about non-obvious or surprising behavior (a workaround for a library bug, a TODO for known debt), or a doc comment on a public API describing its contract for callers who won't read its internals. In short — comment when you're conveying context, not restating logic.

When should you avoid comments and instead improve the code? 
Avoid a comment whenever it exists only to explain what the code does — that's a sign the code itself should be clearer, usually through better naming or extracting a well-named function (e.g. // check if user can checkout becomes canUserCheckout()). Comments should also be avoided as a substitute for fixing confusing code: a comment that says "this is weird, don't touch it" without real context is a maintenance hazard, not documentation — the underlying code (or at least the reasoning) should be clarified instead.

# 4.6 Handling Errors & Edge Cases
 Research: Strategies for Handling Errors and Edge Cases
Guard clauses: check for invalid conditions first and return/throw immediately, instead of nesting the "happy path" inside a big if (valid) { ... } block. This flattens the function and makes the valid conditions for proceeding explicit at the top, rather than buried in an else.
Fail fast: validate inputs as early as possible and reject bad data at the boundary, rather than letting invalid values silently flow deeper into the system where the eventual failure is harder to trace back to its cause.
Use specific, typed errors: throwing a generic Error('something went wrong') gives callers nothing to act on. Custom error types/classes (e.g. InvalidInputError, NotFoundError) let calling code distinguish what went wrong and respond appropriately (e.g. return a 404 vs a 400).
Never silently swallow errors: an empty catch {} block hides failures instead of handling them, making bugs invisible until they cause damage somewhere else. At minimum, log the error; ideally, handle it meaningfully or re-throw it.
Handle edge cases explicitly, don't assume "normal" input: empty arrays, null/undefined, zero, negative numbers, and boundary values (min/max) should be deliberately considered, not left to whatever the code happens to do by accident.
Distinguish expected vs unexpected errors: expected failures (e.g. "user not found," "invalid email") are part of normal control flow and should be handled gracefully with clear messages; unexpected failures (e.g. a database connection drop) may need different handling like retries, alerts, or bubbling up to a global error handler.
Don't let errors leave the system in a bad state: especially in async/multi-step operations, consider what should happen to already-completed steps if a later step fails (e.g. rolling back a partial write).

Example: Poor Error Handling
typescript
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
Problems
getDiscountedPrice doesn't validate its inputs: a negative price, a discountPercent over 100, or non-numeric input (e.g. undefined) all silently produce a nonsensical result (like a negative price) instead of failing clearly.
findUserOrder returns undefined when no match is found, with no signal to the caller that this is a real possibility they need to handle.
processRefund doesn't check whether order exists before using it — if the order isn't found, order.total throws an unhandled TypeError: Cannot read properties of undefined, which gives no useful information about why the refund failed.
There's no distinction between "order not found" (an expected, recoverable case) and a genuine unexpected crash — both currently look like an unhandled exception with a confusing stack trace.
If paymentGateway.refund fails (e.g. network error), there's no try/catch, so the caller of processRefund gets an unhandled rejection with no context about which step failed.

Refactored: Guard Clauses + Explicit Error Handling
typescript
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
Why this is better
Guard clauses at the top of getDiscountedPrice and processRefund reject invalid input immediately, so the rest of each function can assume it's working with valid data — no defensive checks scattered later in the logic.
findUserOrder returns Order | null instead of implicitly undefined, and its return type makes the "not found" case visible in the type system, so callers can't forget to handle it without a type error.
Specific error types (InvalidInputError, OrderNotFoundError, RefundFailedError) let calling code (e.g. an API layer) catch each case and respond appropriately — for example, mapping OrderNotFoundError to a 404 and InvalidInputError to a 400 — instead of treating every failure identically.
The payment gateway call is wrapped in a try/catch that re-throws with context (which order failed and why), instead of letting a raw, unexplained rejection propagate up.
Edge cases are handled explicitly: missing orderId, an order that doesn't exist, and a downstream payment failure are each a distinct, named path instead of one generic crash. 

Reflections

What was the issue with the original code? The original functions assumed their inputs would always be valid and that every operation would succeed, so there was no code path for the cases where that assumption breaks — an order not being found, a bad discount value, or a failed refund call. This meant failures showed up as raw, unhandled exceptions (like a TypeError on order.total) rather than clear, meaningful errors, making it hard to tell why something failed or to distinguish an expected case (order not found) from a genuine bug.

How does handling errors improve reliability? Explicit error handling means failures are anticipated and given a clear, typed identity instead of being an accident that happens to surface as a crash. This makes the system more predictable: callers can catch specific error types and decide how to respond (retry, show a message, log and alert), invalid data is rejected at the boundary before it can corrupt further logic, and when something does fail, the error message actually explains what happened and where — which makes debugging and recovery far faster than tracing back from a generic, unhandled exception.