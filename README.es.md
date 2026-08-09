# 🚀 Guía de Configuración

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de contar con lo siguiente:

- **Base de datos PostgreSQL 17.5**
- **Cuenta de AWS** con S3 configurado para almacenamiento de imágenes
- Archivos **`.env`** configurados tanto para el backend como para el frontend

---

## ⚙️ Flujo de Configuración

1. **Preparar la base de datos** (Postgres 17.5)
2. **Configurar AWS S3** para alojamiento de imágenes
3. **Definir variables de entorno** en el backend (`.env`)
4. **Desplegar el backend**
5. **Definir variables de entorno** en el frontend (`.env`)
6. **Desplegar el frontend**
7. **Configurar los datos iniciales** (tipos de evento, roles y usuarios)

### Almacenamiento de archivos

El backend usa almacenamiento local de forma predeterminada. Configura
`FILE_STORAGE_PROVIDER=local` y monta `FILE_STORAGE_PATH` como volumen persistente en Docker.
La ruta `/files` muestra el estado y las instrucciones de todos los proveedores disponibles.

---

## 🛠 Configuración Inicial (Primera Sesión)

Al acceder a la aplicación por primera vez:

### 1. Configuración de Congregación

- Verificar si existe una **congregación** en la base de datos
  - **Si no existe**, crear una nueva congregación:
    - Configurar los datos de la congregación
    - Añadir una o varias **ubicaciones**
    - Asignar **administradores** con acceso completo
    - Configurar el **bucket de AWS S3** para almacenamiento de imágenes
      - ⚠️ Si esta configuración falla, no será posible usar imágenes

    - Definir el **idioma preferido** para la congregación

### 2. Sesión de Usuario

- Iniciar sesión con un usuario
- Seleccionar y guardar la **preferencia de tema** (modo Oscuro o Claro)

---

## Licenciamiento

Este proyecto está licenciado bajo Apache License, Version 2.0. Ver `LICENSE`.

Puedes:

- Usar el software para fines personales, organizacionales y comerciales
- Modificar y hacer fork del software
- Distribuir copias originales o modificadas
- Desplegarlo y alojarlo por cuenta propia
- Contribuir mejoras

## Filosofía

Este proyecto está pensado para servir a iglesias y ministerios.

Aunque la licencia permite uso comercial, recomendamos fuertemente:

- Contribuir de regreso a la comunidad
- Apoyar financieramente el proyecto si se monetiza
- Respetar el espíritu de colaboración ministerial

---

## Patrocinios

Si este proyecto ayuda a tu iglesia o ministerio, considera apoyarlo:

- [GitHub Sponsors](https://github.com/sponsors/jjwakn)

---

## Documentación del Proyecto

- [Contribuir](./CONTRIBUTING.es.md)
- [Código de Conducta](./CODE_OF_CONDUCT.es.md)
- [Licencia](./LICENSE.es.md)
- [Política de Seguridad](./SECURITY.es.md)
- [Privacidad](./PRIVACY.md)
