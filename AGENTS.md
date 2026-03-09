# Project Agent Guidelines

These rules apply to all agent chats in this repository.

## Communication

- Always respond in English.

## User-Facing Text and i18n

- Do not hardcode user-facing text in code.
- Any text shown to users must use translation keys, including user-facing errors and warnings.
- When possible, log/error/warning messages should also use translation keys.
- Keep wording style consistent with existing product copy.
- Store translations in JSON locale files.
- Frontend keys must be added in both:
  - `front/src/locales/en/*.json`
  - `front/src/locales/es/*.json`
- Backend message keys must be added in both:
  - `back/src/locales/en/**/*.json`
  - `back/src/locales/es/**/*.json`

## Tooling and Commands

- Use `yarn` for package/script commands.

## Frontend Structure

- Keep TypeScript `type`/`interface` declarations in dedicated `*.types.ts` files.
- Keep only shared domain-level types in `front/src/types`.
- Move feature-specific/component-specific types to `*.types.ts` files colocated with the feature/component.
- Keep exactly one React component per `.tsx` file. If a file contains additional components, extract them into separate files.
- Prefer expression-style conditional rendering in React with a top-level ternary return for two-branch views (`condition ? <A /> : <B />`) when it keeps the component clear.
- Prefer arrow functions for consistency.
- Prefer path aliases for project imports (for example `@components/*`, `@utils/*`, `@constants/*`).
- Avoid deep relative imports when an alias is available.
