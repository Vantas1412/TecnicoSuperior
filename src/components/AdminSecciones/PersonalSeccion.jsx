// src/components/AdminSecciones/PersonalSeccion.jsx
import React, { useState, useEffect } from 'react';
import empleadoService from '../../services/empleadoService.js';
import { useAuth } from '../../hooks/useAuth';
import PagoService from '../../services/PagoService';
import RealizaService from '../../services/RealizaService';
import SueldoService from '../../services/SueldoService';
import toast from 'react-hot-toast';
import usuarioService from '../../services/UsuarioService';
import notificacionesService from '../../services/notificacionesService';

const PersonalSeccion = () => {
  const { profile } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [personasDisponibles, setPersonasDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(false);
  const [empleadoEdit, setEmpleadoEdit] = useState(null);
  const [pagoModal, setPagoModal] = useState({ open: false, empleado: null, monto: '', concepto: '' });
  const [pasarela, setPasarela] = useState({ open: false, metodo: 'Transferencia BNB (Cuenta edificio 1-5398771)' });

  // Estado para nuevo empleado (adaptado a tu estructura de BD)
  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    id_persona: '',
    cargo: '', // Se mapea a 'tipo' en la BD
    fecha_contrato: new Date().toISOString().split('T')[0],
    salario: '',
    tipo_de_contrato: 'Indefinido'
  });

  // Cargar empleados y personas disponibles
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      // Verificar que el servicio tenga los métodos
      if (!empleadoService.obtenerEmpleados || !empleadoService.obtenerPersonasDisponibles) {
        throw new Error('El servicio de empleados no está configurado correctamente');
      }

      // Cargar empleados
      const resultadoEmpleados = await empleadoService.obtenerEmpleados();
      if (resultadoEmpleados.success) {
        setEmpleados(resultadoEmpleados.data);
      } else {
        setError(resultadoEmpleados.error || 'Error al cargar los empleados');
      }

      // Cargar personas disponibles (no empleados)
      const resultadoPersonas = await empleadoService.obtenerPersonasDisponibles();
      if (resultadoPersonas.success) {
        setPersonasDisponibles(resultadoPersonas.data);
      } else {
        console.error('Error al cargar personas disponibles:', resultadoPersonas.error);
      }
    } catch (err) {
      setError(err.message || 'Error de conexión al cargar datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAgregarEmpleado = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Validaciones
      if (!nuevoEmpleado.id_persona || !nuevoEmpleado.cargo) {
        setError('Persona y cargo son obligatorios');
        return;
      }

      const resultado = await empleadoService.crearEmpleado(nuevoEmpleado);
      
      if (resultado.success) {
        setShowModal(false);
        resetFormulario();
        await cargarDatos(); // Recargar los datos para actualizar la lista
      } else {
        setError(resultado.error || 'Error al crear el empleado');
      }
    } catch (err) {
      setError('Error de conexión al crear empleado');
      console.error('Error:', err);
    }
  };

  const handleEditarEmpleado = async (e) => {
    e.preventDefault();
    try {
      setError('');

      const resultado = await empleadoService.editarEmpleado(
        empleadoEdit.id_empleado, 
        {
          cargo: empleadoEdit.cargo,
          fecha_contrato: empleadoEdit.fecha_contrato,
          salario: empleadoEdit.salario,
          tipo_de_contrato: empleadoEdit.tipo_de_contrato
        }
      );
      
      if (resultado.success) {
        setShowModal(false);
        setEditando(false);
        setEmpleadoEdit(null);
        await cargarDatos();
      } else {
        setError(resultado.error || 'Error al editar el empleado');
      }
    } catch (err) {
      setError('Error de conexión al editar empleado');
      console.error('Error:', err);
    }
  };

  const handleEliminarEmpleado = async (idEmpleado, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al empleado ${nombre}?`)) {
      try {
        const resultado = await empleadoService.eliminarEmpleado(idEmpleado);
        
        if (resultado.success) {
          cargarDatos();
        } else {
          setError(resultado.error || 'Error al eliminar el empleado');
        }
      } catch (err) {
        setError('Error de conexión al eliminar empleado');
        console.error('Error:', err);
      }
    }
  };

  const abrirModalEditar = (empleado) => {
    setEmpleadoEdit({
      id_empleado: empleado.id_empleado,
      id_persona: empleado.id_persona,
      cargo: empleado.tipo || '', // 'tipo' es el campo en tu BD
      fecha_contrato: empleado.fecha_contratacion || '',
      salario: empleado.sueldo || '',
      tipo_de_contrato: empleado.tipo_de_contrato || 'Indefinido'
    });
    setEditando(true);
    setShowModal(true);
  };

  const abrirModalPagar = (empleado) => {
    const mes = new Date().getMonth() + 1;
    const anio = new Date().getFullYear();
    setPagoModal({
      open: true,
      empleado,
      monto: empleado.sueldo ? String(empleado.sueldo) : '',
      concepto: `SUELDO ${String(mes).padStart(2, '0')}/${anio}`
    });
  };

  const ejecutarPagoSueldo = async () => {
    try {
      if (!pagoModal.empleado) return;
      const montoNum = Number(pagoModal.monto || 0);
      if (!montoNum || montoNum <= 0) {
        toast.error('Ingresa un monto válido');
        return;
      }
      const concepto = pagoModal.concepto?.trim() || 'SUELDO';
      const fecha = new Date().toISOString().slice(0, 10);

      // 1) Crear pago
      const pagoRes = await PagoService.crearPago({
        concepto,
        descripcion: `Pago de salario para ${pagoModal.empleado.persona?.nombre || ''} ${pagoModal.empleado.persona?.apellido || ''}`.trim(),
        monto: montoNum,
        metodo_pago: pasarela?.metodo || 'Transferencia BNB (Cuenta edificio 1-5398771)',
        fecha
      });
      if (!pagoRes.success || !pagoRes.data || !pagoRes.data[0]) {
        throw new Error('No se pudo registrar el pago');
      }
      const pago = pagoRes.data[0];

      // 2) Vincular en realiza: admin (pagador) -> empleado (beneficiario)
      const id_pagador = profile?.persona?.id_persona || profile?.id_persona;
      const id_beneficiario = pagoModal.empleado.id_persona;
      if (id_pagador && id_beneficiario) {
        await RealizaService.crearRealiza({ id_pagador, id_beneficiario, id_pago: pago.id_pago });
      }

      // 3) Registrar entrada en 'sueldo' como historial (opcional)
      await SueldoService.registrarPagoSueldo({ id_empleado: pagoModal.empleado.id_empleado, monto: montoNum, fecha, estado: 'Pagado' });

      // 4) Crear notificación al empleado
      try {
        const u = await usuarioService.obtenerUsuarioPorPersona(pagoModal.empleado.id_persona);
        if (u?.success && u.data?.id_usuario) {
          await notificacionesService.crearNotificacion(
            u.data.id_usuario,
            'Pago de sueldo acreditado',
            `Se acreditó tu ${concepto} por Bs ${montoNum.toFixed(2)}.`
          );
        }
      } catch (notifErr) {
        console.warn('No se pudo notificar al empleado:', notifErr?.message);
      }

      toast.success('Sueldo pagado y registrado');
      setPagoModal({ open: false, empleado: null, monto: '', concepto: '' });
      setPasarela((p) => ({ ...p, open: false }));
    } catch (e) {
      console.error('Error pagando sueldo:', e);
      toast.error('Error al pagar sueldo');
    }
  };

  // Abre la pasarela simulada verificando datos
  const abrirPasarela = () => {
    const montoNum = Number(pagoModal.monto || 0);
    if (!pagoModal.empleado) {
      toast.error('Selecciona un empleado');
      return;
    }
    if (!montoNum || montoNum <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (!pagoModal.concepto?.trim()) {
      toast.error('Ingresa un concepto');
      return;
    }
  setPasarela({ open: true, metodo: 'Transferencia BNB (Cuenta edificio 1-5398771)' });
  };

  const resetFormulario = () => {
    setNuevoEmpleado({
      id_persona: '',
      cargo: '',
      fecha_contrato: new Date().toISOString().split('T')[0],
      salario: '',
      tipo_de_contrato: 'Indefinido'
    });
  };

  // Modal para agregar/editar empleado
  const ModalEmpleado = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {editando ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}
          </h3>
        </div>
        
        <form onSubmit={editando ? handleEditarEmpleado : handleAgregarEmpleado} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {!editando && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Persona *
              </label>
              <select
                value={nuevoEmpleado.id_persona}
                onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, id_persona: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccionar persona</option>
                {personasDisponibles.map(persona => (
                  <option key={persona.id_persona} value={persona.id_persona}>
                    {persona.nombre} {persona.apellido} - CI: {persona.id_persona}
                  </option>
                ))}
              </select>
              {personasDisponibles.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No hay personas disponibles para contratar
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cargo/Tipo *
            </label>
            <input
              type="text"
              value={editando ? empleadoEdit.cargo : nuevoEmpleado.cargo}
              onChange={(e) => editando 
                ? setEmpleadoEdit({...empleadoEdit, cargo: e.target.value})
                : setNuevoEmpleado({...nuevoEmpleado, cargo: e.target.value})
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Conserje, Seguridad, Mantenimiento..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Contrato
            </label>
            <select
              value={editando ? empleadoEdit.tipo_de_contrato : nuevoEmpleado.tipo_de_contrato}
              onChange={(e) => editando
                ? setEmpleadoEdit({...empleadoEdit, tipo_de_contrato: e.target.value})
                : setNuevoEmpleado({...nuevoEmpleado, tipo_de_contrato: e.target.value})
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Indefinido">Indefinido</option>
              <option value="Temporal">Temporal</option>
              <option value="Por Proyecto">Por Proyecto</option>
              <option value="Medio Tiempo">Medio Tiempo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Contratación
            </label>
            <input
              type="date"
              value={editando ? empleadoEdit.fecha_contrato : nuevoEmpleado.fecha_contrato}
              onChange={(e) => editando
                ? setEmpleadoEdit({...empleadoEdit, fecha_contrato: e.target.value})
                : setNuevoEmpleado({...nuevoEmpleado, fecha_contrato: e.target.value})
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sueldo (Bs.)
            </label>
            <input
              type="number"
              step="0.01"
              value={editando ? empleadoEdit.salario : nuevoEmpleado.salario}
              onChange={(e) => editando
                ? setEmpleadoEdit({...empleadoEdit, salario: e.target.value})
                : setNuevoEmpleado({...nuevoEmpleado, salario: e.target.value})
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditando(false);
                setEmpleadoEdit(null);
                resetFormulario();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              {editando ? 'Actualizar' : 'Agregar'} Empleado
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Personal</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando empleados...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Personal</h2>
        <button 
          onClick={() => setShowModal(true)}
          disabled={personasDisponibles.length === 0}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            personasDisponibles.length === 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          + Agregar Empleado
        </button>
      </div>

      {/* Mostrar error si existe */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right text-red-800 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && <ModalEmpleado />}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Empleados</h3>
          <p className="text-3xl font-bold text-gray-800">{empleados.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Sueldo Promedio</h3>
          <p className="text-3xl font-bold text-gray-800">
            Bs. {empleados.length > 0 
              ? (empleados.reduce((sum, e) => sum + (parseFloat(e.sueldo) || 0), 0) / empleados.length).toFixed(2)
              : '0.00'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Personas Disponibles</h3>
          <p className="text-3xl font-bold text-gray-800">
            {personasDisponibles.length}
          </p>
        </div>
      </div>

      {/* Tabla de empleados */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Lista de Empleados</h3>
          <button 
            onClick={cargarDatos}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors duration-200"
          >
            Actualizar
          </button>
        </div>
        
        {empleados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay empleados registrados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto/Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo/Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contrato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sueldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empleados.map((empleado) => (
                  <tr key={empleado.id_empleado} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {empleado.persona?.nombre || 'N/A'} {empleado.persona?.apellido || ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {empleado.id_empleado}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {empleado.usuario?.correo_electronico || 'Sin correo'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {empleado.usuario?.username ? `@${empleado.usuario.username}` : 'Sin usuario'}
                      </div>
                      <div className="text-xs text-gray-400">
                        Tel: {empleado.persona?.telefono || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {empleado.usuario?.rol && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            empleado.usuario.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                            empleado.usuario.rol === 'empleado' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            Rol: {empleado.usuario.rol}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {empleado.tipo || 'Sin especificar'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {empleado.tipo_de_contrato || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {empleado.tipo_de_contrato || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Desde: {empleado.fecha_contratacion ? new Date(empleado.fecha_contratacion).toLocaleDateString('es-BO') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {empleado.sueldo ? `Bs. ${parseFloat(empleado.sueldo).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => abrirModalEditar(empleado)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleEliminarEmpleado(
                            empleado.id_empleado,
                            `${empleado.persona?.nombre || 'este empleado'}`
                          )}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => abrirModalPagar(empleado)}
                          className="text-green-600 hover:text-green-800 transition-colors duration-200"
                        >
                          Pagar sueldo
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal pagar sueldo */}
      {pagoModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Pagar sueldo</h3>
              <p className="text-sm text-gray-500">{pagoModal.empleado?.persona?.nombre} {pagoModal.empleado?.persona?.apellido}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                <input
                  type="text"
                  value={pagoModal.concepto}
                  onChange={(e) => setPagoModal({ ...pagoModal, concepto: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Bs.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={pagoModal.monto}
                  onChange={(e) => setPagoModal({ ...pagoModal, monto: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button onClick={() => setPagoModal({ open: false, empleado: null, monto: '', concepto: '' })} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={abrirPasarela} className="px-4 py-2 bg-green-600 text-white rounded-lg">Pagar</button>
            </div>
          </div>
        </div>
      )}
      {/* Pasarela de pago simulada */}
      <PasarelaPagoSueldoModal
        open={pasarela.open}
        onClose={() => setPasarela((p) => ({ ...p, open: false }))}
        onConfirm={ejecutarPagoSueldo}
        empleado={pagoModal.empleado}
        monto={pagoModal.monto}
        concepto={pagoModal.concepto}
        metodo={pasarela.metodo}
        setMetodo={(met) => setPasarela((p) => ({ ...p, metodo: met }))}
      />
    </div>
  );
};

// Modal de Pasarela de Pago Simulada para sueldos
const PasarelaPagoSueldoModal = ({ open, onClose, onConfirm, empleado, monto, concepto, metodo, setMetodo }) => {
  if (!open) return null;
  const nombre = `${empleado?.persona?.nombre || ''} ${empleado?.persona?.apellido || ''}`.trim() || 'Empleado';
  const cuenta = '1-5398771';
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-5 text-white">
          <h3 className="text-xl font-semibold">Pasarela de pago</h3>
          <p className="text-white/80 text-sm">Se usará la cuenta del edificio para acreditar el sueldo</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cuenta origen</p>
                <p className="text-lg font-semibold text-gray-900">Edificio · N° {cuenta}</p>
                <p className="text-xs text-gray-500">Entidad: Banco Nacional de Bolivia</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Monto</p>
                <p className="text-2xl font-bold text-emerald-600">Bs {Number(monto || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border rounded-lg p-3">
              <p className="text-xs text-gray-500">Beneficiario</p>
              <p className="text-sm font-medium text-gray-900">{nombre}</p>
            </div>
            <div className="bg-white border rounded-lg p-3">
              <p className="text-xs text-gray-500">Concepto</p>
              <p className="text-sm font-medium text-gray-900 truncate" title={concepto}>{concepto}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
            <select
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="Transferencia BNB (Cuenta edificio 1-5398771)">Transferencia BNB (Cuenta edificio 1-5398771)</option>
              <option value="Transferencia BNB (Cuenta admin)">Transferencia BNB (Cuenta admin)</option>
            </select>
          </div>
        </div>
        <div className="p-5 bg-gray-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Confirmar y pagar</button>
        </div>
      </div>
    </div>
  );
};

export default PersonalSeccion;