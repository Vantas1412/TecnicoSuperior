// src/components/EmpleadoSecciones/index.js
// Este archivo centraliza las exportaciones de las secciones disponibles
// para el panel de empleados.  Agrupa los componentes que representan
// diferentes vistas o funcionalidades a las que puede acceder un empleado.

export { default as DashboardSeccion } from './DashboardSeccion';
export { default as VerTareas } from './VerTareas';
export { default as InformeTrabajo } from './InformeTrabajo';
export { default as MandarEvidencia } from './MandarEvidencia';
export { default as ComunicacionSeccion } from './ComunicacionSeccion';

// Sección adicional que proviene de la versión combinada original.  Permite
// al personal de seguridad consultar las entradas registradas al edificio.
export { default as EntradasEmpleadoSeccion } from './EntradasEmpleadoSeccion';