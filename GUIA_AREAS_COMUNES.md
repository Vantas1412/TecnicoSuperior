# 📚 GUÍA: Sistema de Áreas Comunes y Reservas

## ✅ MIGRACIÓN COMPLETADA

La migración SQL se ejecutó exitosamente el 23/10/2025.

### **Base de Datos Actualizada:**
- ✅ 8 columnas nuevas en `area_comun`
- ✅ 10 columnas nuevas en `reserva`
- ✅ 3 funciones PostgreSQL creadas
- ✅ 1 vista `v_reservas_completas`
- ✅ 2 triggers automáticos
- ✅ 4 índices para rendimiento

---

## 📊 ESTRUCTURA DE DATOS

### **Tabla `area_comun`** (13 columnas):
```sql
id_area (VARCHAR)                    -- PK: "ARC001"
nombre (VARCHAR)                     -- "Salón de Eventos"
capacidad (INTEGER)                  -- 80
tipo (VARCHAR)                       -- "Salón"
estado (VARCHAR)                     -- "Disponible"
tiempo_limpieza_horas (INTEGER)      -- 1 ← NUEVO
hora_apertura (TIME)                 -- 08:00 ← NUEVO
hora_cierre (TIME)                   -- 22:00 ← NUEVO
minimo_horas_reserva (INTEGER)       -- 1 ← NUEVO
activo (BOOLEAN)                     -- true ← NUEVO
descripcion (TEXT)                   -- ← NUEVO
ubicacion (VARCHAR)                  -- "Piso 1" ← NUEVO
created_at (TIMESTAMP)               -- ← NUEVO
```

### **Tabla `reserva`** (18 columnas):
```sql
id_reserva (VARCHAR)                 -- PK: "RSV001"
id_registro_area (VARCHAR)           -- FK → area_comun.id_area
id_horario (VARCHAR)                 -- FK → horario.id_horario
id_persona (VARCHAR)                 -- FK → persona.id_persona
id_pago (VARCHAR)                    -- FK → pago.id_pago
fecha_creacion (DATE)                -- 2024-10-12
hora (TIME)                          -- 10:00:00
fecha_reservacion (DATE)             -- 2024-10-15
estado (VARCHAR)                     -- "Pendiente" ← NUEVO
hora_inicio (TIME)                   -- 10:00:00 ← NUEVO
hora_fin (TIME)                      -- 12:00:00 ← NUEVO
hora_fin_con_limpieza (TIME)         -- 13:00:00 ← NUEVO (calculado automáticamente)
estado_entrega (VARCHAR)             -- "Excelente" ← NUEVO
descripcion_entrega (TEXT)           -- ← NUEVO
fecha_entrega (TIMESTAMP)            -- ← NUEVO
entregado_a (VARCHAR)                -- FK → empleado.id_empleado ← NUEVO
created_at (TIMESTAMP)               -- ← NUEVO
updated_at (TIMESTAMP)               -- ← NUEVO
```

---

## 🔧 FUNCIONES POSTGRESQL

### **1. `validar_disponibilidad_horario()`**
```sql
SELECT * FROM validar_disponibilidad_horario(
  'ARC001',              -- id_area
  '2025-01-25',          -- fecha
  '10:00',               -- hora_inicio
  '12:00',               -- hora_fin
  NULL                   -- id_reserva_excluir (opcional)
);
```

**Retorna:**
```json
{
  "disponible": true,
  "mensaje": "Horario disponible"
}
```

**Validaciones:**
- ✅ Área activa
- ✅ Dentro de horario apertura/cierre
- ✅ Duración mínima cumplida
- ✅ Horas completas (sin :30)
- ✅ Sin conflictos (incluyendo tiempo de limpieza)

---

### **2. `obtener_horarios_ocupados()`**
```sql
SELECT * FROM obtener_horarios_ocupados('ARC001', '2025-01-25');
```

**Retorna:**
```json
[
  {
    "hora_inicio": "10:00:00",
    "hora_fin": "12:00:00",
    "hora_fin_con_limpieza": "13:00:00",
    "estado": "Aprobada",
    "residente_nombre": "Juan Pérez"
  }
]
```

---

### **3. Triggers Automáticos**

#### **`trg_calcular_limpieza`**
```sql
-- Se ejecuta automáticamente al insertar/actualizar reserva
-- Calcula hora_fin_con_limpieza = hora_fin + tiempo_limpieza_horas
```

#### **`trg_sincronizar_horario`**
```sql
-- Se ejecuta automáticamente al insertar/actualizar id_horario
-- Copia hora_inicio y hora_fin desde tabla horario
```

---

## 📦 SERVICIOS JAVASCRIPT

### **ReservaService.js**

#### **Validar disponibilidad:**
```javascript
import reservaService from './services/ReservaService';

const resultado = await reservaService.validarDisponibilidad(
  'ARC001',           // idArea
  '2025-01-25',       // fecha
  '10:00:00',         // horaInicio
  '12:00:00'          // horaFin
);

if (resultado.disponible) {
  console.log('✅ Horario disponible');
} else {
  console.log('❌', resultado.mensaje);
}
```

#### **Crear reserva con validación:**
```javascript
const reserva = {
  id_registro_area: 'ARC001',
  id_persona: 'PER001',
  fecha_reservacion: '2025-01-25',
  hora_inicio: '10:00:00',
  hora_fin: '12:00:00',
  id_horario: 'HOR001'  // Opcional
};

const resultado = await reservaService.crearReservaConValidacion(reserva);

if (resultado.success) {
  console.log('✅ Reserva creada:', resultado.data);
} else {
  console.log('❌ Error:', resultado.error);
}
```

#### **Obtener horarios ocupados:**
```javascript
const resultado = await reservaService.obtenerHorariosOcupados('ARC001', '2025-01-25');

if (resultado.success) {
  console.log('Horarios ocupados:', resultado.data);
}
```

#### **Registrar entrega del área:**
```javascript
const resultado = await reservaService.registrarEntregaArea(
  'RSV001',           // idReserva
  'Excelente',        // estadoEntrega: Excelente|Bueno|Regular|Malo|Dañado
  'Todo en orden',    // descripcion
  'EMP001'            // idEmpleado
);

if (resultado.success) {
  console.log('✅ Entrega registrada');
  // Estado de reserva cambia a "Completada" automáticamente
}
```

#### **Obtener reservas completas:**
```javascript
const resultado = await reservaService.obtenerReservasCompletas({
  id_area: 'ARC001',              // Filtro opcional
  fecha_reservacion: '2025-01-25', // Filtro opcional
  estado: 'Aprobada'               // Filtro opcional
});

if (resultado.success) {
  resultado.data.forEach(reserva => {
    console.log(`${reserva.residente_nombre} - ${reserva.nombre_area}`);
  });
}
```

---

### **AreaComunService.js**

#### **Obtener áreas activas:**
```javascript
import areaComunService from './services/AreaComunService';

const resultado = await areaComunService.obtenerAreasActivas();

if (resultado.success) {
  resultado.data.forEach(area => {
    console.log(`${area.nombre} - ${area.ubicacion}`);
  });
}
```

#### **Obtener configuración de horarios:**
```javascript
const config = await areaComunService.obtenerConfiguracionHorarios('ARC001');

if (config.success) {
  console.log('Apertura:', config.data.hora_apertura);
  console.log('Cierre:', config.data.hora_cierre);
  console.log('Mínimo:', config.data.minimo_horas_reserva, 'hora(s)');
  console.log('Limpieza:', config.data.tiempo_limpieza_horas, 'hora(s)');
}
```

#### **Generar horarios disponibles:**
```javascript
const horarios = await areaComunService.generarHorariosDisponibles('ARC001', '2025-01-25');

if (horarios.success) {
  horarios.data.forEach(slot => {
    console.log(`${slot.hora} - ${slot.disponible ? '✅' : '❌'}`);
  });
}
```

---

## 🎨 COMPONENTES REACT

### **1. FormularioEntregaArea.jsx**

```jsx
import FormularioEntregaArea from './components/shared/FormularioEntregaArea';

<FormularioEntregaArea
  reserva={reservaActual}
  empleadoId="EMP001"
  onGuardar={(data) => {
    console.log('Entrega guardada:', data);
    // Actualizar UI
  }}
  onCancelar={() => {
    console.log('Cancelado');
  }}
/>
```

**Estados de entrega disponibles:**
- 🟢 Excelente
- 🔵 Bueno
- 🟡 Regular
- 🟠 Malo
- 🔴 Dañado

---

### **2. SelectorHorarioReserva.jsx**

```jsx
import SelectorHorarioReserva from './components/shared/SelectorHorarioReserva';
import { useState } from 'react';

const [horaInicio, setHoraInicio] = useState('');
const [horaFin, setHoraFin] = useState('');
const [duracion, setDuracion] = useState(0);
const [costo, setCosto] = useState(0);

<SelectorHorarioReserva
  idArea="ARC001"
  fecha="2025-01-25"
  horaInicio={horaInicio}
  horaFin={horaFin}
  onHoraInicioChange={setHoraInicio}
  onHoraFinChange={setHoraFin}
  onDuracionChange={(hrs, cost) => {
    setDuracion(hrs);
    setCosto(cost);
  }}
/>
```

**Características:**
- ✅ Muestra solo horarios disponibles
- ✅ Valida reserva mínima (1 hora)
- ✅ Solo permite horas completas (8:00, 9:00, etc.)
- ✅ Calcula costo automáticamente
- ✅ Muestra tiempo de limpieza bloqueado

---

## 🔄 FLUJO COMPLETO: Crear Reserva

```javascript
// 1. Usuario selecciona área y fecha
const areaId = 'ARC001';
const fecha = '2025-01-25';

// 2. Obtener horarios disponibles
const horariosDisponibles = await areaComunService.generarHorariosDisponibles(areaId, fecha);

// 3. Usuario selecciona horario (ej: 10:00 - 12:00)
const horaInicio = '10:00:00';
const horaFin = '12:00:00';

// 4. Validar disponibilidad
const validacion = await reservaService.validarDisponibilidad(areaId, fecha, horaInicio, horaFin);

if (!validacion.disponible) {
  alert(validacion.mensaje);
  return;
}

// 5. Crear reserva
const nuevaReserva = {
  id_registro_area: areaId,
  id_persona: usuarioActual.id_persona,
  fecha_reservacion: fecha,
  hora_inicio: horaInicio,
  hora_fin: horaFin,
  estado: 'Pendiente'
};

const resultado = await reservaService.crearReservaConValidacion(nuevaReserva);

if (resultado.success) {
  alert('✅ Reserva creada exitosamente');
  // La hora_fin_con_limpieza se calcula automáticamente por el trigger
  // Por ejemplo: hora_fin=12:00 → hora_fin_con_limpieza=13:00
}
```

---

## 🔄 FLUJO COMPLETO: Registrar Entrega

```javascript
// 1. Empleado recibe el área al finalizar la reserva
const reservaId = 'RSV001';
const empleadoId = 'EMP001';

// 2. Evalúa el estado del área
const estadoEntrega = 'Excelente'; // o Bueno, Regular, Malo, Dañado

// 3. Agrega observaciones (opcional)
const descripcion = 'Todo en perfecto estado. No se encontraron daños.';

// 4. Registra la entrega
const resultado = await reservaService.registrarEntregaArea(
  reservaId,
  estadoEntrega,
  descripcion,
  empleadoId
);

if (resultado.success) {
  alert('✅ Entrega registrada');
  // La reserva cambia automáticamente a estado "Completada"
}
```

---

## 📊 EJEMPLO: Vista `v_reservas_completas`

```javascript
// Obtener todas las reservas con información completa
const resultado = await reservaService.obtenerReservasCompletas();

resultado.data.forEach(r => {
  console.log(`
    Reserva: ${r.id_reserva}
    Área: ${r.nombre_area} (${r.tipo_area})
    Ubicación: ${r.ubicacion}
    Capacidad: ${r.capacidad} personas
    
    Residente: ${r.residente_nombre}
    Teléfono: ${r.residente_telefono}
    
    Fecha: ${r.fecha_reservacion}
    Horario: ${r.hora_inicio} - ${r.hora_fin}
    Limpieza hasta: ${r.hora_fin_con_limpieza}
    
    Estado: ${r.estado}
    ${r.estado_entrega ? `Estado entrega: ${r.estado_entrega}` : ''}
    ${r.entregado_a_nombre ? `Recibido por: ${r.entregado_a_nombre}` : ''}
  `);
});
```

---

## ⚠️ VALIDACIONES IMPORTANTES

### **Al crear reserva:**
1. ✅ El área debe estar activa (`activo = true`)
2. ✅ Hora inicio >= `hora_apertura` del área
3. ✅ Hora fin <= `hora_cierre` del área
4. ✅ Duración >= `minimo_horas_reserva` (default: 1 hora)
5. ✅ Solo horas completas (8:00, 9:00, NO 8:30)
6. ✅ No conflictos con otras reservas (incluyendo tiempo de limpieza)

### **Cálculo automático de limpieza:**
```
hora_inicio: 10:00
hora_fin: 12:00
tiempo_limpieza_horas: 1
→ hora_fin_con_limpieza: 13:00 (calculado por trigger)
```

**Esto significa:**
- ✅ El área está reservada de 10:00 a 12:00
- ✅ El área está BLOQUEADA de 12:00 a 13:00 para limpieza
- ✅ La siguiente reserva puede ser a partir de las 13:00

---

## 🎯 ESTADOS DE RESERVA

```javascript
'Pendiente'   // Recién creada, esperando aprobación
'Aprobada'    // Confirmada por admin
'Rechazada'   // Denegada
'Cancelada'   // Cancelada por usuario/admin
'Completada'  // Finalizada con entrega registrada
'En Uso'      // Actualmente en curso
```

---

## 🎯 ESTADOS DE ENTREGA

```javascript
'Excelente'   // 🟢 Perfecto estado
'Bueno'       // 🔵 Buen estado general
'Regular'     // 🟡 Estado aceptable
'Malo'        // 🟠 Necesita atención
'Dañado'      // 🔴 Requiere reparación
```

---

## 📝 NOTAS IMPORTANTES

1. **IDs son VARCHAR:** Todos los IDs en tu base de datos son `VARCHAR`, no `INTEGER`
2. **Trigger automático:** Al insertar/actualizar `hora_fin`, se calcula automáticamente `hora_fin_con_limpieza`
3. **Sincronización con horario:** Si asignas `id_horario`, se copian automáticamente `hora_inicio` y `hora_fin`
4. **Vista vs Tabla:** Usa `v_reservas_completas` para lecturas, `reserva` para escrituras
5. **Validación del lado del servidor:** Siempre usa `validar_disponibilidad_horario()` antes de crear reservas

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Migración SQL ejecutada
2. ✅ Servicios JS actualizados
3. ✅ Componentes React creados
4. 🔄 **Integrar componentes en módulo de residentes**
5. 🔄 **Integrar formulario de entrega en módulo de empleados**
6. 🔄 **Agregar notificaciones por email**
7. 🔄 **Probar flujo completo end-to-end**

---

## 📞 SOPORTE

Si encuentras algún error o necesitas ayuda:
1. Revisa esta guía primero
2. Verifica que la migración se ejecutó correctamente
3. Prueba las funciones SQL directamente en Supabase
4. Revisa la consola del navegador para errores JS

---

**Última actualización:** 23/10/2025
**Versión:** 1.0 Final
**Estado:** ✅ Producción
