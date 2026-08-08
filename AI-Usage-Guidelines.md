# AI Usage Guidelines

##  Goal
Understand how to responsibly and effectively use AI tools while maintaining data privacy and critical thinking.

##  Why is this important?
AI tools can boost productivity, but they should be used thoughtfully. Misuse—such as leaking confidential information or relying on AI without critical thinking—can cause serious problems.

##  Research & Learn

### What AI tools are typically used for your role?
As a software development intern, the AI tools most relevant to my role are GitHub Copilot, an AI code assistant that provides in-IDE code completion and boilerplate generation; ChatGPT, a conversational AI used for research, debugging ideas, and documentation drafting; and Claude, a conversational AI used for code understanding, learning new technologies, and writing documentation.

### What are the benefits and risks of using AI in a professional setting?
**Benefits:**
- Speeds up coding (autocomplete, boilerplate)
- Helps learn new frameworks/APIs faster
- Assists with writing documentation, comments, commit messages

**Risks:**
- Generated code may contain bugs, security issues, or outdated patterns
- Risk of leaking confidential company/client data if pasted into public AI tools
- Over-reliance can erode understanding, making it hard to debug issues later
- AI can "hallucinate" — sound confident while being wrong

### What types of information should never be entered into AI tools?
- User/customer PII (names, emails, addresses, health data, etc.)
- Secrets: passwords, API keys, access tokens
- Company trade secrets, internal database schemas, proprietary algorithms
- Unreleased product roadmaps or financial data
- Anything covered by an NDA

### How can you fact-check and validate AI-generated content to ensure accuracy?
- Code: run it locally and write/run tests — don't merge just because it "looks right"
- Technical claims: cross-check against official docs (e.g. repo README, official GitHub docs)
- Logic: walk through the code yourself to understand every line, rather than copy-pasting blindly
- Flag uncertain AI output as "AI-generated, needs verification" and put it through normal code review

##  Reflection

### When should you use AI for assistance, and when should you rely on your own skills?
AI is useful for speeding up repetitive or well-understood tasks — boilerplate code, syntax lookups, drafting documentation, or exploring an unfamiliar API. I should rely on my own skills for core logic design, architectural decisions, and anything involving sensitive data, since these require judgment and accountability that AI can't provide. If I can't explain or verify why a piece of AI-generated code works, I shouldn't be the one submitting it.

### How can you avoid over-reliance on AI while still benefiting from it?
I'll treat AI output as a first draft or a starting point, not a final answer — always reading, testing, and understanding the code before using it. I'll also try to solve a problem myself first (or at least form my own approach) before asking AI, so I keep building my own problem-solving skills rather than defaulting to AI immediately.

### What steps will you take to ensure data privacy when using AI tools?
I will never paste confidential company code, credentials, API keys, or any user/customer data into public AI tools. Where possible, I'll anonymize or use placeholder data when asking for help with a specific problem, and stick to company-approved AI tools/settings if Focus Bear provides any guidance on this.

##  Task

### 1. Identify one task you can improve using an AI tool, and try it out
I used Claude to generate a pagination utility function for the NestJS onboarding project. The task was: "generate a pagination parameter handler that takes `page` and `limit` from a query and returns `page`, `limit`, and `skip` values." Claude produced the following:

```typescript
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

export function getPaginationParams(query: PaginationParams): PaginationResult {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
```

### 2. Review the AI-generated output critically — did it require editing or fact-checking?
Yes. The code runs without errors on valid input, but a critical review uncovered several unhandled edge cases:

| Input | Result | Problem |
|---|---|---|
| `page = -1` or `page = 0` | `skip` becomes negative | No lower-bound validation |
| `limit = 100000` | Returns 100,000 rows | No upper-bound cap — could overload the database |
| `page = "abc"` | `skip` becomes `NaN` | No type validation — `\|\|` doesn't catch non-numeric strings |

The AI output only handled the "no value provided" case via default values (`||`), but completely omitted input validation for out-of-range or wrongly-typed values. This meant the code **looked correct and ran without errors, but was not safe to use as-is** — it required manual fixes such as clamping `page`/`limit` to sane bounds and adding proper type validation (e.g. via NestJS `class-validator`/DTOs) before it could be trusted in a real endpoint.

This exercise reinforced why AI-generated code needs to be tested and reasoned through line-by-line rather than accepted at face value.

### 3. Document one best practice you will follow when using AI tools at Focus Bear
Never trust AI-generated code at face value — always test edge cases and validate input handling before merging, even when the code looks correct and runs without errors. AI tends to handle the "happy path" well but silently skips boundary conditions (negative numbers, oversized values, wrong types), so manual review is essential every time.
