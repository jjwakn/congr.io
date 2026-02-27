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

Este proyecto está disponible en código fuente para uso no comercial.

Si deseas:

- Ofrecer hosting
- Vender servicios basados en este software
- Usarlo comercialmente

Debes obtener una licencia comercial.

Contacto: jjwakn@gmail.com

---

## Documentación del Proyecto

- [Contribuir](./CONTRIBUTING.es.md)
- [Código de Conducta](./CODE_OF_CONDUCT.es.md)
- [Licencia](./LICENSE.es.md)
- [Política de Seguridad](./SECURITY.es.md)
- [Privacidad](./PRIVACY.md)
