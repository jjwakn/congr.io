# **Backend – Congr.io**

## **Resumen**

Este backend está construido con **[NestJS](https://nestjs.com/)**, un framework progresivo de Node.js que aprovecha TypeScript, decoradores e inyección de dependencias para crear aplicaciones escalables del lado del servidor.
Elegimos NestJS porque ofrece:

- **Arquitectura modular** → Facilita la organización de funcionalidades en módulos (servicios, controladores, entidades, etc.).
- **TypeScript-first** → El tipado fuerte mejora el mantenimiento y reduce errores en tiempo de ejecución.
- **Soporte integrado para estándares** → Integración sencilla con Swagger.

---

## **Swagger**

Swagger se sirve en puerto 4000. Proporcionamos un endpoint por idioma:

- Inglés: http://localhost:4000/api-en
- Español: http://localhost:4000/api-es

---

## **Internacionalización (i18n)**

Usamos **[nestjs-i18n](https://nestjs-i18n.com/)** para manejar traducciones en múltiples idiomas.

### **Cambiar el idioma por solicitud**

El idioma se resuelve automáticamente desde los **Headers**:

```
Accept-Language: es
```

Ejemplo:

```bash
curl -H "Accept-Language: es" http://localhost:3000/users
```

---

### **Agregar más traducciones**

Los archivos de traducción están ubicados en:

```
src/i18n/
  ├── en
  └── es
```

Cada clave debe existir **en todos los archivos de traducción** para mantener la coherencia.

Los idiomas actualmente soportados son inglés (`en`) y español (`es`).

Ejemplo:
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

Si agregas una nueva clave en un idioma, **también debes** agregarla en los demás archivos de idioma.

Tambien se tiene que actualizar `main.ts`, estos son los lenguajes soportados para Swagger
