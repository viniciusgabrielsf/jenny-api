---
name: backend-testing
description: 'Standardize unit and integration tests in src/__tests__ for Jenny API. Use when adding or updating tests, choosing test type, or setting up Jest test structure.'
argument-hint: 'What to test and the level (unit or integration)'
---

# Jenny API Testing Standards

## When to Use

- Adding or updating tests under [src/**tests**](src/__tests__).
- Deciding between unit and integration coverage.
- Standardizing naming, mocks, and setup.

## Decision Guide

- Unit test: isolated logic (helpers, model hooks, service logic). Mock DB/models/external libs.
- Integration test: route + middleware + service flow. Use the real Express app and avoid mocking the core layers. You can mock the DB or external services if needed, but not the app's internal logic.

## Placement and Naming

- Unit tests live under [src/**tests**/unit](src/__tests__/unit) and use `<name>.spec.ts`.
- Integration tests live under [src/**tests**/integration](src/__tests__/integration) and use `<name>.spec.ts`.
- Name describe blocks as `<Thing> (Unit Test)` or `<Route> (Integration Test)`.

## Unit Test Rules

- No network or DB. Mock models, helpers, and external libraries.
- Clear mocks in `beforeEach` and keep tests deterministic.
- Freeze time when needed (for example, mock `Date.now`).

## Integration Test Rules

- Use the real app from [src/app.ts](src/app.ts) with supertest.
- Use a dedicated test database and clean up between tests.
- Avoid mocking services or models unless testing a specific failure path.

## Procedure

1. Classify the test (unit vs integration) using the Decision Guide.
2. Place the file in the correct folder and name it `*.spec.ts`.
3. Follow the rules for mocks, setup, and deterministic data.
4. Run tests with `npm test` and fix flakiness.

## References

- Jest configuration: [jest.config.ts](jest.config.ts)
- Test root: [src/**tests**](src/__tests__)
- Unit tests: [src/**tests**/unit](src/__tests__/unit)
- Integration tests: [src/**tests**/integration](src/__tests__/integration)
- Express app: [src/app.ts](src/app.ts)
