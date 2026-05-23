---
description: 'AI instructions for Jenny API (Copilot and Claude).'
---

# Jenny API AI Instructions

## Product context

- Jenny is a web app that helps young adults manage their finances.
- The backend serves mobile and desktop browsers.

## Commands

- dev: `npm run dev`
- build: `npm run build`
- start: `npm start`
- test: `npm test` (coverage: `npm run test:coverage`)
- lint/format: `npm run lint`, `npm run format`

## Architecture map

- Entry: [src/server.ts](src/server.ts) boots [src/app.ts](src/app.ts).
- Routes: [src/routes/index.ts](src/routes/index.ts) mounts `/users`, `/auth`, `/payments`.
- Controllers: [src/controllers](src/controllers) (HTTP only).
- Services: [src/services](src/services) (business logic + data access).
- Models: [src/models](src/models) (`sequelize-typescript`).
- Middleware: [src/config/middleware](src/config/middleware).
- Helpers/schemas: [src/helpers](src/helpers) and [src/helpers/schemas](src/helpers/schemas).

## Request and auth patterns

- Validate inputs with Zod; controllers call services only.
- Access and refresh JWTs live in httpOnly cookies; refresh cookie scoped to `/api/auth/refresh`.
- Refresh tokens persisted in `auth_refresh_token` with `familyId`; keep rotation and cleanup (`MAX_TOKENS`).
- If `req.user` changes, update [src/config/express.d.ts](src/config/express.d.ts).
- if need to declare uuid whit zod. uses z.uuid.
- if need to declare optional uuid with zod, uses z.preprocess(emptyStringToUndefined, z.uuid().optional()),

## Data and error handling

- Postgres via `sequelize-typescript`; avoid `sequelize.sync()` in prod; use transactions for multi-step writes.
- Exclude `passwordHash` from responses.
- Throw `HttpException` subclasses; [errorHandler](src/config/middleware/error-handler.middleware.ts) maps to JSON.
- Sequelize timezone is `-03:00` (keep consistent).

## Validation, pagination, and queries

- Zod schemas live in [src/helpers/schemas](src/helpers/schemas); map validation errors to `BadRequestException`.
- Pagination and sorting helpers live in [src/helpers/get-options.helper.ts](src/helpers/get-options.helper.ts).

## Testing

- Jest + ts-jest; tests under [src/**tests**](src/__tests__).
- Use supertest for HTTP-level coverage when needed.

## Package guardrails

- express: keep routes thin; async handlers return or throw.
- cors: origin must be explicit with `credentials: true`.
- helmet: keep defaults; add CSP if frontend grows.
- cookie-parser: tokens must be httpOnly; no localStorage tokens.
- jsonwebtoken: secrets only from env; validate type and expiration.
- bcryptjs: hash on create/update; never log hashes.
- sequelize: explicit attributes, avoid N+1; use transactions.
- morgan: avoid PII in logs; minimal format in prod.
- swagger: keep JSDoc in sync; update server URL for prod.

## Required env vars

- `PORT`, `NODE_ENV`, `ORIGIN`
- `DB_CONTAINER_NAME`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `TZ`
- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRATION`, `REFRESH_TOKEN_EXPIRATION`
- `MAX_TOKENS`

## TypeScript conventions

- Keep classes and methods in camelCase.
- Keep `tsconfig.json` strict; avoid `any` unless justified.
