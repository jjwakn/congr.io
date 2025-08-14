# **Backend – Congr.io**

## **Overview**

This backend is built using **[NestJS](https://nestjs.com/)**, a progressive Node.js framework that leverages TypeScript, decorators, and dependency injection for scalable server-side applications.
We chose NestJS because it provides:

- **Modular architecture** → Easy to organize features into modules (services, controllers, entities, etc.).
- **TypeScript-first** → Strong typing improves maintainability and reduces runtime errors.
- **Built-in support for standards** → Easy integration with Swagger,

---

## **Internationalization (i18n)**

We use **[nestjs-i18n](https://nestjs-i18n.com/)** to manage translations in multiple languages.

### **Changing Language per Request**

The language is resolved automatically from the **Headers**

```
Accept-Language: es
```

Example:

```bash
curl -H "Accept-Language: es" http://localhost:3000/users
```

---

### **Adding More Translations**

Translation files are stored in:

```
src/i18n/
  ├── en
  └── es
```

Each key should exist **in all translation files** to maintain consistency.

The current supported languages are English (`en`) and Spanish(`es`)

Example:
**`en/errors.json`**

```json
{
  "user": {
    "notFound": "User not found"
  }
}
```

**`es/errors.json`**

```json
{
  "errors": {
    "user": {
      "notFound": "Usuario no encontrado"
    }
  }
}
```

If you add a new key in one language, you **must** add it to all others.
