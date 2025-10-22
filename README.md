# 🏢 Sistema de Gestión - Técnico Superior

Sistema completo de gestión para edificios residenciales con panel de administración, empleados y residentes.

##  Stack Tecnológico

- **Frontend:** React + Vite
- **Backend:** Supabase (PostgreSQL)
- **Email:** Resend API + Node.js/Express
- **Estilos:** Tailwind CSS
- **Autenticación:** Supabase Auth

## 📋 Características Principales

- ✅ Panel de administración completo
- ✅ Dashboard para empleados
- ✅ Portal para residentes
- ✅ Sistema de notificaciones
- ✅ Gestión de quejas y sugerencias
- ✅ Control de incidentes
- ✅ Avisos y anuncios
- ✅ **Envío automático de correos** 📧

## 🔧 Instalación

### 1. Instalar dependencias principales
```bash
npm install
```

### 2. Configurar servidor de correos
```bash
cd email-server
npm install
```

### 3. Configurar variables de entorno
Edita el archivo `.env`:
```env
# Supabase
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anon

# Resend Email (obtener en https://resend.com/api-keys)
RESEND_API_KEY=re_TU_API_KEY_AQUI
EMAIL_FROM=onboarding@resend.dev
VITE_EMAIL_API_URL=http://localhost:3001/api/send-email

# Libélula (pasarela de pagos)
# URL sandbox por defecto: https://sandbox.libelula.bo/api/v1
LIBELULA_API_URL=https://sandbox.libelula.bo/api/v1
LIBELULA_APP_KEY=11bb10ce-68ba-4af1-8eb7-4e6624fed729
LIBELULA_SANDBOX=true
LIBELULA_MOCK=true  # Opcional: activa mocks si el sandbox no responde o no resuelve DNS

# Frontend -> Backend base URL
VITE_API_BASE_URL=http://localhost:3001
```

## 🎯 Iniciar el Sistema

**Terminal 1 - Servidor de correos:**
```bash
cd email-server
node server.js
```

**Terminal 2 - Aplicación principal:**
```bash
npm run dev
```

**Windows (usando batch):**
```bash
cd email-server
iniciar-servidor.bat
```

## 📧 Sistema de Correos

El sistema envía correos automáticamente en los siguientes casos:

| Evento | Destinatario |
|--------|--------------|
| Inicio de sesión | Usuario que accedió |
| Notificación individual | Usuario específico |
| Aviso general | Todos los residentes/empleados |
| Respuesta a queja | Usuario que creó la queja |

## 🏗️ Estructura del Proyecto

```
TecnicoSuperior/
├── src/
│   ├── components/        # Componentes React
│   ├── services/          # Servicios y APIs
│   ├── contexts/          # Context API
│   └── hooks/             # Custom hooks
├── email-server/          # Servidor de correos con Resend
│   ├── server.js          # API backend
│   └── package.json       # Dependencias
│   └── (también expone /api/libelula/* para pagos)
├── public/                # Archivos estáticos
├── sql/                   # Scripts SQL
└── .env                   # Variables de entorno
```

## 🔒 Seguridad

- ✅ Autenticación con Supabase
- ✅ Roles de usuario (Admin, Empleado, Residente)
- ✅ Rutas protegidas
- ✅ API Keys en backend (nunca en frontend)
## 💳 Pasarela de Pagos Libélula

Este proyecto integra una pasarela de pagos (QR y Tarjeta) usando un backend proxy en `email-server` que se comunica con la API de Libélula. El frontend llama al backend usando `VITE_API_BASE_URL`.

Rutas expuestas por el backend:

- POST `/api/libelula/payment/new` → Crea una orden de pago
- GET `/api/libelula/payment/status/:ordenId` → Consulta estado
- POST `/api/libelula/payment/process-card` → Procesa tarjeta
- GET `/api/libelula/payment/qr/:ordenId` → Obtiene QR (si aplica)
- POST `/api/libelula/webhook` → Recepción de callbacks

Para usarlo:
1) configura las variables de entorno en `.env` como se indica arriba (APP_KEY y API_URL)
2) inicia el servidor `email-server` y el frontend
3) desde la UI, selecciona el método (QR o Tarjeta) y sigue el flujo.

Notas:
- El APP KEY de Libélula debe residir sólo en el backend.
- El webhook puede necesitar verificación de firma (pendiente de manual oficial).

- ✅ CORS configurado
- ✅ Validación de datos

## 🎨 Roles y Permisos

| Rol | Acceso |
|-----|--------|
| **Admin** | Acceso completo al sistema |
| **Empleado** | Gestión de incidentes, mantenimiento |
| **Residente** | Ver información, crear quejas |

## 🚀 Deployment

### Frontend
```bash
npm run build
```

### Servidor de Correos
```bash
cd email-server
npm start
```

**Nota:** En producción, configura las variables de entorno en tu servicio de hosting.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT

---

**Desarrollado con ❤️ usando React, Vite, Supabase y Resend**
