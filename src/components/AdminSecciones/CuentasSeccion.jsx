// src/components/AdminSecciones/CuentasSeccion.jsx
import React, { useState, useEffect, useMemo } from 'react';
import usuarioService from '../../services/UsuarioService';
// Las rutas de servicios deben coincidir con el nombre real del archivo en
// sistemas sensibles a mayúsculas y minúsculas.  En este proyecto, el
// servicio de residentes se define en `ResidenteService.js`, por lo que
// lo importamos con la R mayúscula.
import residenteService from '../../services/residenteService';
import empleadoService from '../../services/empleadoService';

const initialFormState = (role) => ({
  role,
  personaId: '',
  username: '',
  password: '',
  email: '',
  estado: 'activo'
});

const getNombreCompleto = (persona) => {
  if (!persona) return 'Sin datos';
  const parts = [persona.nombre, persona.apellido].filter(Boolean);
  return parts.length ? parts.join(' ') : persona.id_persona || 'Sin datos';
};

const getEstadoStyles = (estado) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (estado) {
    case 'activo':
      return `${base} bg-green-100 text-green-800`;
    case 'inactivo':
      return `${base} bg-red-100 text-red-800`;
    case 'pendiente':
      return `${base} bg-yellow-100 text-yellow-800`;
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
};

const formatFecha = (fecha) => {
  if (!fecha) return '-';
  try {
    return new Date(fecha).toLocaleDateString('es-BO');
  } catch {
    return '-';
  }
};

const CuentasSeccion = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [residentes, setResidentes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [activeRole, setActiveRole] = useState('residente');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [formData, setFormData] = useState(initialFormState('residente'));
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [workingId, setWorkingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [usuariosRes, residentesRes, empleadosRes] = await Promise.all([
        usuarioService.obtenerUsuarios(),
        residenteService.obtenerResidentes(),
        empleadoService.obtenerEmpleados()
      ]);

      if (!usuariosRes.success) throw new Error(usuariosRes.error || 'No se pudieron cargar las cuentas');
      if (!residentesRes.success) throw new Error(residentesRes.error || 'No se pudieron cargar los residentes');
      if (!empleadosRes.success) throw new Error(empleadosRes.error || 'No se pudieron cargar los empleados');

      setUsuarios(usuariosRes.data || []);
      setResidentes(residentesRes.data || []);
      setEmpleados(empleadosRes.data || []);
    } catch (err) {
      console.error('Error al cargar datos de cuentas:', err);
      setError(err.message || 'Error inesperado al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const usuariosPorRol = useMemo(() => {
    const filtro = search.trim().toLowerCase();
    return usuarios
      .filter((usuario) => usuario.rol === activeRole)
      .filter((usuario) => {
        if (!filtro) return true;
        const nombrePersona = getNombreCompleto(usuario.persona).toLowerCase();
        return (
          usuario.username.toLowerCase().includes(filtro) ||
          nombrePersona.includes(filtro)
        );
      })
      .sort((a, b) => a.username.localeCompare(b.username));
  }, [usuarios, activeRole, search]);

  const residentesSinCuenta = useMemo(() => {
    const idsOcupados = new Set(
      usuarios.filter((u) => u.rol === 'residente').map((u) => u.id_persona)
    );
    return residentes.filter((residente) => !idsOcupados.has(residente.id_persona));
  }, [residentes, usuarios]);

  const empleadosSinCuenta = useMemo(() => {
    const idsOcupados = new Set(
      usuarios.filter((u) => u.rol === 'empleado').map((u) => u.id_persona)
    );
    return empleados.filter((empleado) => !idsOcupados.has(empleado.id_persona));
  }, [empleados, usuarios]);

  const disponiblesActuales = activeRole === 'residente' ? residentesSinCuenta : empleadosSinCuenta;
  const totalDisponibles = disponiblesActuales.length;

  const resetModalState = (role = activeRole) => {
    setFormData(initialFormState(role));
    setSelectedUsuario(null);
    setProcessing(false);
    setError('');
  };

  const openCreateModal = () => {
    setModalMode('create');
    resetModalState(activeRole);
    setModalOpen(true);
  };

  const openEditModal = (usuario) => {
    setModalMode('edit');
    setSelectedUsuario(usuario);
    setFormData({
      role: usuario.rol,
      personaId: usuario.id_persona,
      username: usuario.username,
      password: '',
      email: usuario.correo_electronico || '',
      estado: usuario.estado || 'activo'
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetModalState();
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!formData.personaId || !formData.username || !formData.password) {
      setError('Completa todos los campos obligatorios');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      setFeedback('');

      const payload = {
        username: formData.username.trim(),
        password: formData.password,
        rol: activeRole,
        estado: formData.estado,
        id_persona: formData.personaId,
        correo_electronico: formData.email ? formData.email.trim() : null,
        fecha_registro: new Date().toISOString(),
        urlfoto: null,
        id_auth: null
      };

      const resultado = await usuarioService.crearUsuario(payload);
      if (!resultado.success) throw new Error(resultado.error || 'No se pudo crear la cuenta');

      setFeedback('Cuenta creada correctamente');
      closeModal();
      await loadData();
    } catch (err) {
      console.error('Error al crear la cuenta:', err);
      setError(err.message || 'Ocurrió un error al crear la cuenta');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    if (!selectedUsuario) return;
    if (!formData.username) {
      setError('El nombre de usuario es obligatorio');
      return;
    }

    try {
      setProcessing(true);
      setError('');
      setFeedback('');

      const payload = {
        username: formData.username.trim(),
        estado: formData.estado,
        correo_electronico: formData.email ? formData.email.trim() : null
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const resultado = await usuarioService.editarUsuario(selectedUsuario.id_usuario, payload);
      if (!resultado.success) throw new Error(resultado.error || 'No se pudo actualizar la cuenta');

      setFeedback('Cuenta actualizada correctamente');
      closeModal();
      await loadData();
    } catch (err) {
      console.error('Error al actualizar la cuenta:', err);
      setError(err.message || 'Ocurrió un error al actualizar la cuenta');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (usuario) => {
    if (!window.confirm(`¿Eliminar la cuenta ${usuario.username}?`)) return;
    try {
      setWorkingId(usuario.id_usuario);
      setFeedback('');
      setError('');
      const resultado = await usuarioService.eliminarUsuario(usuario.id_usuario);
      if (!resultado.success) throw new Error(resultado.error || 'No se pudo eliminar la cuenta');
      setFeedback('Cuenta eliminada correctamente');
      await loadData();
    } catch (err) {
      console.error('Error al eliminar la cuenta:', err);
      setError(err.message || 'Ocurrió un error al eliminar la cuenta');
    } finally {
      setWorkingId(null);
    }
  };

  const renderModal = () => {
    if (!modalOpen) return null;
    const isCreate = modalMode === 'create';
    const disponibleOptions = formData.role === 'residente' ? residentesSinCuenta : empleadosSinCuenta;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h3 className="text-xl font-semibold text-gray-800">
              {isCreate ? 'Crear cuenta' : 'Editar cuenta'}
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={isCreate ? handleCreate : handleEdit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {isCreate ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.role === 'residente' ? 'Residente' : 'Empleado'} *
                </label>
                <select
                  value={formData.personaId}
                  onChange={(event) => setFormData({ ...formData, personaId: event.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecciona una persona</option>
                  {disponibleOptions.map((item) => (
                    <option key={item.id_persona} value={item.id_persona}>
                      {getNombreCompleto(item.persona)} — CI: {item.id_persona}
                    </option>
                  ))}
                </select>
                {!disponibleOptions.length && (
                  <p className="mt-2 text-sm text-gray-500">
                    No hay personas disponibles sin cuenta para este rol.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600 uppercase tracking-wide">Asignado a</p>
                <p className="text-base font-semibold text-gray-800">
                  {getNombreCompleto(selectedUsuario?.persona)}
                </p>
                <p className="text-sm text-gray-500">CI: {selectedUsuario?.id_persona || 'Sin datos'}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(event) => setFormData({ ...formData, username: event.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre de usuario"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña {isCreate ? '*' : '(opcional)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={isCreate ? 'Contraseña temporal' : 'Dejar en blanco para mantenerla'}
                required={isCreate}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <select
                value={formData.estado}
                onChange={(event) => setFormData({ ...formData, estado: event.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                disabled={processing}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60"
                disabled={processing || (isCreate && !disponibleOptions.length)}
              >
                {processing ? 'Guardando...' : isCreate ? 'Crear cuenta' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Cuentas</h2>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Cargando cuentas y personas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Cuentas</h2>
          <p className="text-sm text-gray-500">Administra los accesos de residentes y empleados al sistema</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            totalDisponibles > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
          disabled={totalDisponibles === 0}
        >
          + Nueva cuenta de {activeRole === 'residente' ? 'residente' : 'empleado'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-start">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-800 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {feedback && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex justify-between items-start">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-green-800 hover:text-green-900"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        {['residente', 'empleado'].map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => {
              setActiveRole(role);
              setFormData(initialFormState(role));
              setSearch('');
              setError('');
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeRole === role
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {role === 'residente' ? 'Cuentas de residentes' : 'Cuentas de empleados'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-5">
          <p className="text-sm text-gray-500">Cuentas activas</p>
          <p className="text-2xl font-semibold text-gray-800">
            {usuariosPorRol.filter((usuario) => usuario.estado === 'activo').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-purple-500 p-5">
          <p className="text-sm text-gray-500">Total cuentas de {activeRole === 'residente' ? 'residentes' : 'empleados'}</p>
          <p className="text-2xl font-semibold text-gray-800">{usuariosPorRol.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-5">
          <p className="text-sm text-gray-500">Personas disponibles sin cuenta</p>
          <p className="text-2xl font-semibold text-gray-800">{totalDisponibles}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {activeRole === 'residente' ? 'Cuentas de residentes' : 'Cuentas de empleados'}
          </h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buscar por usuario o nombre"
            />
            <button
              type="button"
              onClick={loadData}
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
            >
              Actualizar
            </button>
          </div>
        </div>

        {usuariosPorRol.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay cuentas registradas para este rol.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Persona</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosPorRol.map((usuario) => (
                  <tr key={usuario.id_usuario} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{usuario.username}</div>
                      <div className="text-xs text-gray-500">ID cuenta: {usuario.id_usuario}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getNombreCompleto(usuario.persona)}</div>
                      <div className="text-xs text-gray-500">CI: {usuario.id_persona || 'Sin datos'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getEstadoStyles(usuario.estado)}>{usuario.estado || 'desconocido'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {usuario.correo_electronico || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatFecha(usuario.fecha_registro)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(usuario)}
                        className="text-blue-600 hover:text-blue-800"
                        disabled={workingId === usuario.id_usuario}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(usuario)}
                        className="text-red-600 hover:text-red-800"
                        disabled={workingId === usuario.id_usuario}
                      >
                        {workingId === usuario.id_usuario ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {renderModal()}
    </div>
  );
};

export default CuentasSeccion;
