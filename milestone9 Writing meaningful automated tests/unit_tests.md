# Milestone 9.2 — Mocking API Calls in Jest

## Reflection

**Why is it important to mock API calls in tests?**

With the use of mock API, we didn't need a real backend environment and database. The real test environment is unstable, but mock API provides a consistently stable environment, so the test results are reliable and reproducible. Furthermore, mocking only tests the component's own logic — it doesn't test whether the real backend or the network connection is actually working. That's a separate concern, usually covered by integration/e2e tests instead.

**What are some common pitfalls when testing asynchronous code?**

- **Inconsistent variable naming.** I declared the error state as `const [errot, setError] = useState(null)` but referenced it later as `error`. Since `errot` and `error` are two different names, this threw `Uncaught ReferenceError: error is not defined` — a good reminder to double-check every variable name matches exactly, especially in state declarations that get referenced many times.
- **Trusting editor autocomplete without checking it.** While typing `test(...)` and `jest.fn(...)`, autocomplete suggested `TestEnvironment(...)` and `JSDOMEnvironment.fn(...)` instead, and I accepted them without noticing. Both `test` and `jest` are globals injected by Jest itself — they don't need to be imported, and the autocompleted names were unrelated APIs from other packages. Lesson: always read what autocomplete inserted before moving on, especially with unfamiliar global functions.
- **Mocking async functions with the wrong shape.** The real `fetch` API returns a Promise that resolves to a Response object, and calling `.json()` on that Response *also* returns a Promise. If the mock doesn't match that exact shape (e.g. returning a plain object instead of `Promise.resolve({ json: () => Promise.resolve(data) })`), the component's `.then()` chain breaks immediately with `TypeError: ... .then is not a function`, since `.then()` only exists on Promise-like objects. A mock has to match the real API's interface, not just its final output value.
- **Assertion text not matching the exact rendered text.** `screen.getByText('Loading')` failed even though the page clearly showed "Loading..." — because Testing Library's `getByText` does an exact match by default, not a substring match. The fix was matching the query string exactly to what's rendered (or using a regex/`{ exact: false }` if partial matching is genuinely needed).

## What I built

- `UserProfile.jsx`: a React component that fetches user data on mount (`useEffect` with an empty dependency array) and renders one of three states — loading, error, or the user's name.
- `UserProfile.test.jsx`: a Jest + React Testing Library test that mocks `global.fetch` with `jest.fn()`, renders the component, asserts the loading state appears first, then uses `waitFor` to assert the fetched name renders after the mocked promise resolves.
- Test passes: `PASS src/UserProfile.test.jsx`.

Code pushed to GitHub under `milestone9 Writing meaningful automated tests/jest-mocking-demo/` in the onboarding repo.
