import React, { useEffect, useState } from "react";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { apiService } from "../services/api.js";
import toast from "react-hot-toast";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  QUALITY_MANAGER: "Gestión de Calidad",
  DOCUMENT_OWNER: "Propietario de Documentos",
  REVIEWER: "Revisor",
  APPROVER: "Aprobador",
  READER: "Lector",
};

export function UsuariosPagina() {
  const [Usuarios, setUsuarios] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [Pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "READER",
    area: "",
  });

  const limit = 20;

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [Pagina, mostrarInactivos]);

  const fetchAreas = async () => {
    try {
      const response = await apiService.getAreas();
      setAreas(response.data.data?.items || response.data.data || []);
    } catch {
      // silently fail — area dropdown becomes free text fallback
    }
  };

  const fetchUsuarios = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUsers(Pagina, limit, mostrarInactivos);
      setUsuarios(response.data.data.items);
      setTotal(response.data.data.total);
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createUser(formData);
      toast.success("Usuario creado exitosamente");
      setFormData({ email: "", firstName: "", lastName: "", password: "", role: "READER", area: "" });
      setShowCreateForm(false);
      fetchUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al crear usuario");
    }
  };

  const handleDesactivar = async (usuarioId: string, nombre: string) => {
    if (!window.confirm(`¿Desactivar al usuario "${nombre}"?\n\nEl usuario no podrá iniciar sesión, pero su historial de actividad se conserva íntegro.`)) return;
    try {
      await apiService.deleteUser(usuarioId);
      toast.success("Usuario desactivado. Su historial queda conservado.");
      fetchUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al desactivar usuario");
    }
  };

  const handleReactivar = async (usuarioId: string, nombre: string) => {
    if (!window.confirm(`¿Reactivar al usuario "${nombre}"?`)) return;
    try {
      await apiService.reactivateUser(usuarioId);
      toast.success("Usuario reactivado correctamente.");
      fetchUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al reactivar usuario");
    }
  };

  const totalPaginas = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancelar" : "Crear Usuario"}
        </Button>
      </div>

      {/* Crear Usuario Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateUsuario} className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Nuevo Usuario</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Correo electrónico" type="email" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            <Input label="Contraseña temporal" type="password" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            <Input label="Nombre" value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
            <Input label="Apellido" value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Rol</label>
              <select value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Área</label>
              {areas.length > 0 ? (
                <select value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sin área asignada —</option>
                  {areas.map((a: any) => (
                    <option key={a.id} value={a.code}>{a.name}</option>
                  ))}
                </select>
              ) : (
                <Input value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="Código de área" />
              )}
            </div>
          </div>
          <Button type="submit">Crear Usuario</Button>
        </form>
      )}

      {/* Toggle inactive */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
          <input type="checkbox" checked={mostrarInactivos}
            onChange={(e) => { setMostrarInactivos(e.target.checked); setPagina(1); }}
            className="rounded" />
          Mostrar también usuarios desactivados
        </label>
      </div>

      {/* Usuarios Table */}
      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Correo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Área</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Usuarios.map((Usuario) => (
                  <tr key={Usuario.id} className={`hover:bg-gray-50 ${!Usuario.isActive ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {Usuario.firstName} {Usuario.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{Usuario.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {ROLE_LABELS[Usuario.role] || Usuario.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {areas.find((a: any) => a.code === Usuario.area)?.name || Usuario.area || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {Usuario.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Activo</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">Desactivado</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {Usuario.isActive ? (
                        <button onClick={() => handleDesactivar(Usuario.id, `${Usuario.firstName} ${Usuario.lastName}`)}
                          className="text-amber-600 hover:text-amber-800 hover:underline text-sm">
                          Desactivar
                        </button>
                      ) : (
                        <button onClick={() => handleReactivar(Usuario.id, `${Usuario.firstName} ${Usuario.lastName}`)}
                          className="text-green-600 hover:text-green-800 hover:underline text-sm">
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {(Pagina - 1) * limit + 1}–{Math.min(Pagina * limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPagina(Math.max(1, Pagina - 1))} disabled={Pagina === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm">Anterior</button>
              <span className="px-3 py-1 text-sm">Página {Pagina} de {totalPaginas}</span>
              <button onClick={() => setPagina(Math.min(totalPaginas, Pagina + 1))} disabled={Pagina === totalPaginas}
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm">Siguiente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { UsuariosPagina as UsersPage };

