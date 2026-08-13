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