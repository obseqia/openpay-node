# AGENTS.md

Repository-specific guidance for agentic coding tools working in `openpay-node`.

## Scope

- Applies to the whole repository.
- Prefer `pnpm`; the repo includes `pnpm-lock.yaml` and the README uses `pnpm`.
- Never use `npm`; always use `pnpm` for installs, scripts, and package info lookups.
- Do not hand-edit `dist/`; regenerate it.
- Main sources are `src/openpay.ts` and `src/types.ts`.
- Tests are integration tests in `tests/*.spec.ts` and hit Openpay sandbox APIs.

## Other Agent Rules

- Cursor rules: none found. No `.cursor/rules/` or `.cursorrules` exists.
- Copilot rules: none found. No `.github/copilot-instructions.md` exists.

## Stack And Layout

- TypeScript, `ofetch`, `tsup`, ESLint, Prettier, Vitest, `dotenv`.
- `src/openpay.ts`: SDK implementation and public export surface.
- `src/types.ts`: `IOpenpay` namespace and SDK/public type definitions.
- `tests/mexico.spec.ts`: broadest feature coverage.
- `tests/colombia.spec.ts`: Colombia flows such as PSE and stores.
- `tests/peru.spec.ts`: Peru flows such as checkout APIs.
- `eslint.config.ts`: ESLint flat config with `typescript-eslint` recommended preset.
- `.prettierrc.mjs`: Prettier formatting rules including `prettier-plugin-organize-imports`.
- `tsconfig.json`: strict TS settings.
- `.env.example`: template for `.env.testing`.

## Install

```bash
pnpm install
```

## Git Setup

This repository is a modernized fork of the official Openpay SDK. To maintain compatibility with the upstream repository and facilitate contributing back:

```bash
# Add upstream remote to track the official Openpay repository
git remote add upstream https://github.com/open-pay/openpay-node
```

You can then use `git fetch upstream` to stay updated with the official repository and `git cherry-pick` to bring in specific changes.

## Build, Lint, And Test

```bash
pnpm build
pnpm lint
pnpm format
pnpm test:mx
pnpm test:co
pnpm test:pe
```

## Command Notes

- `pnpm build` runs `rimraf dist && tsup src/openpay.ts --format cjs,esm --dts --no-splitting`.
- `pnpm lint` runs `eslint ./src`; it does not lint `tests` by default.
- `pnpm format` runs `prettier --write .`; formats all source, tests, and config files.
- `pnpm test:mx` runs `vitest run mexico`.
- `pnpm test:co` runs `vitest run colombia`.
- `pnpm test:pe` runs `vitest run peru`.

## Single-Test Guidance

- Tests import from `../dist/openpay`, not `src`, so build first.
- Run one suite:

```bash
pnpm build && pnpm vitest run tests/mexico.spec.ts
pnpm build && pnpm vitest run tests/colombia.spec.ts
pnpm build && pnpm vitest run tests/peru.spec.ts
```

- Run one test case:

```bash
pnpm build && pnpm vitest run tests/mexico.spec.ts -t "should create a customer"
```

- `-t` / `--testNamePattern` works, but these suites are stateful; isolated tests may fail if they depend on earlier setup.
- Prefer running a whole country suite unless you know the targeted case is self-contained.

## Extra Useful Commands

```bash
pnpm exec tsc --noEmit
pnpm exec prettier --write .
pnpm exec eslint ./src ./tests
```

- There is no dedicated `typecheck` script.
- `eslint ./src ./tests` is useful when touching tests because the default lint script only covers `src`.

## Test Environment

- Create `.env.testing` before running Vitest.
- Use `.env.example` as the template.
- Required variables:
  - `OPENPAY_MERCHANT_ID`
  - `OPENPAY_PRIVATE_KEY`
  - `OPENPAY_DEVICE_SESSION_ID`
  - `OPENPAY_WEBHOOK_TEST_URL`
- Use sandbox credentials only.
- Use credentials from the same country as the suite being run.

## Formatting Rules

- Follow `.prettierrc.mjs`.
- Indent with 2 spaces.
- Use single quotes.
- Always use semicolons.
- Target roughly 110 columns.
- Import organization is handled automatically by `prettier-plugin-organize-imports` on format.
- Do not manually reorder imports; run `pnpm format` and let the plugin handle it.

## Import Rules

- Put `import type` statements before value imports when both are used.
- Use relative imports inside `src`, e.g. `./types`.
- Keep public type re-exports explicit, e.g. `export { IOpenpay } from './types';`.
- Avoid adding barrel files unless the structure changes materially.

## Type Rules

- Preserve `strict` TypeScript compatibility.
- Preserve `noUncheckedIndexedAccess` compatibility.
- Prefer explicit interfaces/type aliases for the public API.
- Add request/response types to `src/types.ts` first, then wire methods in `src/openpay.ts`.
- Follow the existing namespace pattern: `IOpenpay.<Area>` for public types and `IOpenpay.SDK.<Area>` for SDK method groups.
- ESLint warns on `@typescript-eslint/no-explicit-any`; use `any` sparingly and prefer `unknown` internally.

## Naming Rules

- Classes, interfaces, and namespaces use `PascalCase`.
- Methods, parameters, locals, and object vars use `camelCase`.
- Constants use `UPPER_SNAKE_CASE`.
- Preserve Openpay wire-format field names in snake_case.
- Keep country codes as `'mx' | 'co' | 'pe'`.

## Implementation Patterns

- Reuse `sendRequest` for normal versioned merchant endpoints.
- Reuse `sendStoreRequest` for store endpoints.
- Build URLs from the merchant ID, country-specific base URLs, and API version constants.
- Keep auth header generation consistent with the current basic-auth pattern from `privateKey`.
- Preserve `X-Forwarded-For` on merchant requests.
- Prefer small wrapper methods that map directly to REST endpoints.

## Error Handling

- Preserve current behavior unless you are intentionally improving it.
- Invalid client IP currently logs with `console.error` and throws `Error`.
- Unknown country codes currently log and fall back to Mexico.
- Network/API failures should surface as `FetchError` from `ofetch`; do not swallow them.
- In docs and examples, prefer `try/catch`; in tests, use `expect(...).resolves` or `rejects`.

## Test Conventions

- Follow the existing Vitest style: `describe`, `it`, `expect`, `assert`.
- The suites are ordered, stateful, and integration-heavy; preserve sequencing when extending them.
- Shared mutable IDs in outer scope are normal in this repo; change carefully.
- Minimal `console.log` output for created resource IDs is acceptable in tests.
- Small local helpers such as `toFilterDate` are preferred over premature abstractions.
- Use `@ts-expect-error` only with a short reason for a known typing mismatch.

## Safe Change Checklist

- Update `src/types.ts` and `src/openpay.ts` together for public SDK changes.
- Run `pnpm build` after source changes.
- Run the most relevant country suite for endpoint changes.
- Run `pnpm exec tsc --noEmit` after type-heavy work.
- Run `pnpm exec eslint ./src ./tests` if you touched tests.

## Documentation Lookup

- Before creating or modifying any configuration file whose syntax depends on a specific package version, use context7 to retrieve the canonical documentation for that version. Do not assume syntax from prior versions.
- Key lookups by task:
  - **ESLint flat config**: `typescript-eslint` → flat config recommended preset; `eslint-config-prettier` → flat config usage
  - **Prettier config**: `prettier` → `singleQuote`, `semi`, `printWidth`, plugin registration in `.prettierrc.mjs`
  - **prettier-plugin-organize-imports**: plugin registration syntax and ESM config format
  - **tsconfig / tsup**: `typescript` → `NodeNext` moduleResolution and import extension requirements; `tsup` → dual CJS/ESM output
  - **GitHub Actions**: `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` → current version tags and pnpm cache setup

## Avoid

- Do not edit `dist/` directly.
- Do not convert Openpay request/response field names to camelCase.
- Do not assume tests are unit-isolated; they create and mutate live sandbox resources.
- Do not manually reorder imports; let `prettier-plugin-organize-imports` handle it via `pnpm format`.
- Do not use `npm`; always use `pnpm`.
