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

- Use switches for every binary selection. Do not introduce checkbox controls.
- Gate every section, route, settings tab, permission row, and related action behind its
  congregation feature before rendering it.

- Keep TypeScript `type`/`interface` declarations in dedicated `*.types.ts` files.
- Keep only shared domain-level types in `front/src/types`.
- Move feature-specific/component-specific types to `*.types.ts` files colocated with the feature/component.
- Keep exactly one React component per `.tsx` file. If a file contains additional components, extract them into separate files.
- Prefer expression-style conditional rendering in React with a top-level ternary return for two-branch views (`condition ? <A /> : <B />`) when it keeps the component clear.
- Prefer arrow functions for consistency.
- Prefer path aliases for project imports (for example `@components/*`, `@utils/*`, `@constants/*`).
- Avoid deep relative imports when an alias is available.

### New Frontend CRUD Models

- Every UI section or tab that manages a persisted model must use the shared CRUD pattern below. This applies even when the CRUD is embedded inside Settings or another parent page rather than exposed as a standalone module route.
- Permission-gate the section/tab and each create, view, update, and delete action independently using the model's backend permission module.

- Use the existing module CRUD UI pattern before creating model-specific layouts:
  - `ModuleSection`
  - `ModuleListTable`
  - `ModuleRowActions`
  - `ModuleStandardActions`
  - `CreateEditDialog`
  - `ViewDialog`
  - `ConfirmDialog`
- Keep each new model under its module folder with single-purpose files:
  - `ModelManagement.tsx` for orchestration and API actions.
  - `ModelFormDialog.tsx` for create/edit fields.
  - `ModelDetailsDialog.tsx` for read-only details.
  - `useModelsList.ts` for list/search/sort/pagination state.
  - `model.types.ts` or `models.types.ts` for colocated component and hook types.
- Add a `front/src/services/<models>.ts` service file for the model API instead of hardcoding URLs in components.
- Reuse shared components when behavior matches an existing module. Add model-specific components only for model-specific form fields or display behavior.
- Keep list screens consistent with Roles CRUD: permission-gate access, use shared row actions, support refresh/search/sort/pagination, and use confirmation dialogs for deletes.
- Every visible data column must be sortable. Sort controls must visually distinguish inactive, ascending, and descending states.
- List search must include all default visible data columns except actions and enabled/active columns. Multi-word search terms are AND conditions across distinct searchable fields.
- Active/enabled state belongs in the list, not in create/edit forms. Show an active column before actions and confirm enable/disable changes from that column.
- Boolean columns need an All/Yes/No filter. Numeric columns need condition filters such as greater than, less than, and between.
- Persisted-model lists must support per-user visible column preferences. Custom fields may be optional columns, but default search fields must remain stable even when hidden.
- Add all user-facing text to both English and Spanish locale JSON files before using it in code.
- When adding seed scripts for a model, include related join-table inserts when the model depends on existing roles, congregations, locations, or other relations.

## Backend Structure

- Keep backend feature code under `back/src/modules/<module>`.
- Use the established module file pattern for persisted models:
  - `<module>.entity.ts`
  - `<module>.types.ts`
  - `<module>.service.ts`
  - `<module>.controller.ts`
  - `<module>.module.ts`
- Keep backend DTOs, query classes, and service action prop interfaces in the module `*.types.ts` file.
- Use `class-validator`, `class-transformer`, and `@nestjs/swagger` decorators on request DTOs and query classes.
- Extend `ListParamsQuery` for list endpoints and define an `Order` enum for sortable model fields. Include `CommonOrder` when common fields such as `id` or `enabled` are sortable.
- Persisted entities should extend `CommonEntity`, define TypeORM columns and relations explicitly, and include `ApiProperty`/`ApiPropertyI18n` metadata where appropriate.
- Prefer `CommonController` for standard CRUD modules. Use a custom controller only when the model needs request context, custom DTO validation, or non-standard routes.
- Custom controllers must use `AuthGuard`, `PermissionGuard`, `PermissionDecorator`, `ParseUUIDPipe` for UUID params, and `ValidationPipe({ transform: true, whitelist: true })` for query/body DTOs.
- Use `getRequestUserIdOrThrow` in custom controllers instead of reading `request.user` manually.
- Services should inject repositories with `@InjectRepository`, normalize incoming DTO data before persistence, and use `findWithFilters` and `cleanColumns` when they fit the query/response shape.
- Set `created_by`, `updated_by`, and `deleted_by` consistently when creating, updating, and soft-deleting rows.
- Use `softDelete` for deletes unless a hard delete is explicitly required.
- Throw Nest exceptions with translation keys from backend locale files; do not hardcode user-facing backend error messages.
- Scope congregation-owned data through `getUserCongregationContext` and include `congregation_id` filters in list/get/update/delete operations.
- Module files should register repositories with `TypeOrmModule.forFeature`, import dependent modules, use `forwardRef` only for circular module dependencies, and export the service plus `TypeOrmModule` when other modules need them.

### New Backend Models

- Create the standard module files in `back/src/modules/<module>`.
- Add the model entity to the module `TypeOrmModule.forFeature` list and import any modules needed for related repositories or services.
- Add or update the `Module` enum and `permission` map in `back/src/utils/constants.ts` when the model has protected routes.
- Add backend translation keys in both `back/src/locales/en/**/*.json` and `back/src/locales/es/**/*.json` for errors, examples, and any user-facing messages.
- Implement list/get/create/update/remove in the service using existing local patterns before adding new abstractions.
- Validate relation IDs in the service before assigning relations, and use translated not-found/in-use errors for invalid or blocked operations.
- Return freshly loaded entities after create/update when relations or cleaned audit columns matter.
- Add seed SQL for the model and its join tables when the model is part of sample data.
