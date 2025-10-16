# 📧 Guía de Configuración: Recuperación de Contraseña con Supabase

## 🎯 Resumen

Se ha implementado un sistema completo de recuperación de contraseña con **dos modos de operación**:

### ✅ Lo que se implementó:

1. **Componente ForgotPassword** - Solicitar recuperación de contraseña
2. **Componente ResetPassword** - Establecer nueva contraseña
3. **Enlace en Login** - "¿Olvidaste tu contraseña?"
4. **Rutas configuradas** - `/forgot-password` y `/reset-password`
5. **Modo Desarrollo** - Solución alternativa sin necesidad de correo

---

## 🔧 MODO DESARROLLO (Sin correos - Recomendado para testing)

### Flujo de uso:

1. **En Login:** Clic en "¿Olvidaste tu contraseña?"
2. **En Forgot Password:** 
   - Ingresa cualquier email
   - Clic en "Enviar Instrucciones"
   - 🟢 **Aparecerá un botón verde:** "Ir a Restablecer Contraseña (Modo Desarrollo)"
3. **Clic en el botón verde**
4. **En Reset Password:**
   - 📧 **Campo adicional:** "Correo Electrónico del Usuario" (fondo azul)
   - Ingresa el email del usuario cuya contraseña deseas cambiar
   - Ingresa la nueva contraseña (mínimo 8 caracteres)
   - Confirma la contraseña
   - Clic en "Restablecer Contraseña"
5. ✅ **La contraseña se actualiza directamente en la base de datos**
6. **Redirección automática** al login

### Ventajas:
- ✅ No requiere configuración de correos
- ✅ Funciona inmediatamente
- ✅ Perfecto para desarrollo y testing
- ✅ Actualización directa en base de datos

---

## 📮 MODO PRODUCCIÓN (Con correos de Supabase)

### Configuración en Supabase Dashboard:

#### 1. **Configurar URLs de Redirección**

Navega a: **Project Settings → Authentication → URL Configuration**

```
Site URL: https://tu-dominio.com
Redirect URLs: 
  - https://tu-dominio.com/reset-password
  - http://localhost:5173/reset-password (para desarrollo)
```

#### 2. **Configurar Email Templates**

Navega a: **Authentication → Email Templates → Reset Password**

La plantilla por defecto debería funcionar. Verifica que contenga:
```
{{ .ConfirmationURL }}
```

#### 3. **Configurar SMTP (Opcional - Recomendado para producción)**

Navega a: **Project Settings → Auth → SMTP Settings**

**Opción A: Gmail**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: tu-email@gmail.com
SMTP Password: [Contraseña de aplicación de Gmail]
Sender Email: tu-email@gmail.com
Sender Name: Tu Edificio
```

**Para obtener contraseña de aplicación de Gmail:**
1. Ve a tu cuenta de Google
2. Seguridad → Verificación en 2 pasos (activar)
3. Contraseñas de aplicaciones → Generar
4. Usa esa contraseña en Supabase

**Opción B: SendGrid, Mailgun, etc.**
- Configurar según la documentación del proveedor

---

## ⚠️ Limitaciones de Supabase (Plan Gratuito)

### Envío de Correos:
- **Solo 3-4 emails por hora** en desarrollo
- Los correos pueden **tardar varios minutos** en llegar
- Pueden ir a la **carpeta de SPAM**
- No apto para producción sin SMTP configurado

### Solución:
- **Desarrollo:** Usa el modo desarrollo (botón verde)
- **Producción:** Configura SMTP personalizado

---

## 🔍 Verificación de la Base de Datos

Para verificar que un usuario existe en tu base de datos:

```sql
-- En Supabase SQL Editor
SELECT id_usuario, correo_electronico, username 
FROM usuario 
WHERE correo_electronico = 'email@ejemplo.com';
```

---

## 🎨 Características de la Interfaz

### ForgotPassword:
- ✅ Validación de formato de email
- ✅ Mensajes de éxito/error
- ✅ Botón verde para modo desarrollo
- ✅ Información sobre configuración de Supabase
- ✅ Enlace para volver al login

### ResetPassword:
- ✅ Campo de email (solo en desarrollo)
- ✅ Indicador de fortaleza de contraseña (5 niveles)
- ✅ Mostrar/ocultar contraseña
- ✅ Validación de coincidencia de contraseñas
- ✅ Requisitos visuales de contraseña
- ✅ Indicadores de cumplimiento en tiempo real
- ✅ Redirección automática después del éxito

---

## 🧪 Prueba Rápida (Modo Desarrollo)

1. Ejecuta el proyecto: `npm run dev`
2. Ve al login
3. Clic en "¿Olvidaste tu contraseña?"
4. Ingresa: `test@ejemplo.com`
5. Clic en "Enviar Instrucciones"
6. Clic en el botón verde que aparece
7. En Reset Password:
   - Email: Ingresa el email de un usuario real de tu BD
   - Nueva contraseña: `MiNuevaPass123!`
   - Confirmar: `MiNuevaPass123!`
8. Clic en "Restablecer Contraseña"
9. ✅ Inicia sesión con la nueva contraseña

---

## 📝 Usuarios de Prueba

Puedes probar con estos usuarios (según tu base de datos):

```
Admin:
Email: (busca en tu tabla usuario)
Username: cgutierrezaruni
Password actual: AdminPass123!

Empleado:
Email: (busca en tu tabla usuario)
Username: walterquintanillavi
Password actual: Empleado1Pass!

Residente:
Email: (busca en tu tabla usuario)
Username: anchoque3
Password actual: Residente1Pass!
```

---

## 🐛 Troubleshooting

### "No me llega el correo"
- ✅ **Solución:** Usa el modo desarrollo (botón verde)
- Verifica configuración de SMTP en Supabase
- Revisa carpeta de spam
- Espera 5-10 minutos (Supabase puede ser lento)

### "Error al actualizar contraseña"
- Verifica que el email exista en la tabla `usuario`
- Asegúrate de estar en modo desarrollo (localhost)
- Revisa la consola del navegador para logs

### "Enlace inválido o expirado"
- En desarrollo, ignora este mensaje
- El modo desarrollo no requiere sesión válida
- Usa el botón verde de acceso directo

---

## 🔐 Seguridad

### Requisitos de Contraseña:
- ✅ Mínimo 8 caracteres
- ✅ Combinar mayúsculas y minúsculas
- ✅ Al menos un número
- ✅ Al menos un carácter especial

### Indicador de Fortaleza:
- 🔴 Muy débil (1 punto)
- 🟠 Débil (2 puntos)
- 🟡 Aceptable (3 puntos)
- 🟢 Fuerte (4 puntos)
- 🟢 Muy fuerte (5 puntos)

---

## 📚 Archivos Creados/Modificados

```
✅ src/components/ForgotPassword.jsx - Nuevo
✅ src/components/ResetPassword.jsx - Nuevo
✅ src/pages/auth/LoginPage.jsx - Modificado (enlace agregado)
✅ src/App.jsx - Modificado (rutas agregadas)
✅ src/services/authService.js - Modificado (métodos agregados)
```

---

## 🚀 Para Producción

Antes de llevar a producción:

1. ✅ Configurar SMTP en Supabase
2. ✅ Actualizar Site URL con tu dominio real
3. ✅ Agregar dominio a Redirect URLs
4. ✅ Probar envío de correos
5. ✅ Personalizar plantilla de email
6. ✅ El modo desarrollo se desactivará automáticamente

---

## 💡 Recomendaciones

- **Desarrollo:** Usa siempre el botón verde (modo desarrollo)
- **Testing:** Prueba con usuarios reales de tu base de datos
- **Producción:** Configura SMTP antes de lanzar
- **Seguridad:** Las contraseñas se almacenan en texto plano en tu BD (considera encriptación para producción)

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que estás en `localhost`
2. Comprueba la consola del navegador (F12)
3. Revisa que el email existe en tu base de datos
4. Usa el modo desarrollo para testing

---

**Última actualización:** 16 de octubre de 2025
**Estado:** ✅ Completamente funcional en modo desarrollo
