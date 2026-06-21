# Project Guidelines for Claude

- Always respond in English and use `yarn` for project commands.
- Never hardcode user-facing text. Add frontend keys to both English and Spanish JSON locales, and backend keys to both backend locales.
- Keep frontend interfaces and types in dedicated `*.types.ts` files and exactly one React component per `.tsx` file.
- Every UI section or tab that manages a persisted model must use the shared CRUD pattern, even when embedded inside Settings or another parent page.
- Reuse `ModuleSection`, `ModuleListTable`, `ModuleRowActions`, `ModuleStandardActions`, `CreateEditDialog`, `ViewDialog`, and `ConfirmDialog` where their behavior matches.
- Permission-gate each persisted-model section or tab and its create, view, update, and delete actions independently using the model's backend permission module.
- Use a service file under `front/src/services`, colocated form/details/list-hook files, server-side search/sort/pagination, and confirmation dialogs for deletes.
- Scope congregation-owned backend data through `getUserCongregationContext` and verify the selected congregation belongs to the authenticated user.
