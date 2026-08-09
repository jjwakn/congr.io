# Project rules for GitHub Copilot

1. Always answer in English.
2. Do not hardcode user-facing strings.
3. Any user-facing text must go through i18n keys and JSON locale files, including user-facing errors and warnings.
4. When possible, log/error/warning messages should also use translation keys.
5. Keep copy tone/style consistent with existing app text.
6. For frontend i18n, update both:
   - `front/src/locales/en/*.json`
   - `front/src/locales/es/*.json`
7. For backend i18n, update both:
   - `back/src/locales/en/**/*.json`
   - `back/src/locales/es/**/*.json`
8. Use `yarn` commands (not npm/pnpm) when running scripts.
9. Keep TypeScript type/interface declarations in dedicated `*.types.ts` files.
10. In frontend, keep only shared domain-level types in `front/src/types`; colocate feature/component-specific `*.types.ts` files with those files.
11. Keep exactly one React component per `.tsx` file; extract additional components into separate files.
12. Prefer expression-style conditional rendering in React with a top-level ternary return for two-branch views (`condition ? <A /> : <B />`) when it keeps the component clear.
13. Prefer arrow functions for consistency.
14. Prefer path aliases for project imports (for example `@components/*`, `@utils/*`, `@constants/*`).
15. Avoid deep relative imports when an alias is available.
16. Every UI section or tab that manages a persisted model must use the shared CRUD components and file structure, even when embedded inside Settings or another parent page.
17. Permission-gate persisted-model sections/tabs and their create, view, update, and delete actions independently using the model's backend permission module.
18. Use switches for all binary selections; do not add checkbox controls.
19. Gate every section, route, settings tab, permission row, and related action by its congregation feature.
20. Every visible data column must be sortable and show inactive, ascending, and descending sort states.
21. List search must cover all default visible data columns except actions and enabled/active columns.
22. Multi-word search terms are AND conditions across distinct searchable fields.
23. Active/enabled state belongs in list rows, not create/edit forms, with confirmation before changes.
24. Boolean columns need All/Yes/No filters; numeric columns need condition filters.
25. Persisted-model lists must support per-user visible column preferences, including custom field columns.
