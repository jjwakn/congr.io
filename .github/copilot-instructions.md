# Project rules for GitHub Copilot

1. Always answer in English.
2. Do not hardcode user-facing strings.
3. Any user-facing text must go through i18n keys and JSON locale files.
4. Keep copy tone/style consistent with existing app text.
5. For frontend i18n, update both:
   - `front/src/locales/en/*.json`
   - `front/src/locales/es/*.json`
6. For backend i18n, update both:
   - `back/src/locales/en/**/*.json`
   - `back/src/locales/es/**/*.json`
7. Use `yarn` commands (not npm/pnpm) when running scripts.
8. Keep TypeScript type/interface declarations in dedicated `*.types.ts` files.
9. In frontend, keep only shared domain-level types in `front/src/types`; colocate feature/component-specific `*.types.ts` files with those files.
10. Keep exactly one React component per `.tsx` file; extract additional components into separate files.
11. Prefer expression-style conditional rendering in React with a top-level ternary return for two-branch views (`condition ? <A /> : <B />`) when it keeps the component clear.
12. Prefer arrow functions for consistency.
13. Prefer path aliases for project imports (for example `@components/*`, `@utils/*`, `@constants/*`).
14. Avoid deep relative imports when an alias is available.
