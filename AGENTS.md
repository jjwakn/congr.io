2# Project Agent Guidelines

These rules apply to all agent chats in this repository.

## Communication

- Always respond in English.

## User-Facing Text and i18n

- Do not hardcode user-facing text in code.
- Any text shown to users must use translation keys.
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
