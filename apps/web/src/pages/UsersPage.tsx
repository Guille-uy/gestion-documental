import React, { useEffect, useState } from "react";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { apiService } from "../services/api.js";
import toast from "react-hot-toast";

export function UsuariosPagina() {
  const [Usuarios, setUsuarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [Pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    Contrasena: "",
    Rol: "READER",
    area: "",
  });

  const limit = 20;

  useEffect(() => {
    fetchUsuarios();
  }, [Pagina]);

  const fetchUsuarios = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUsuarios(Pagina, limit);
      setUsuarios(response.data.data.items);
      setTotal(response.data.data.total);
    } catch (error) {
      toast.error("Error al cargar Usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiService.createUsuario(formData);
      toast.success("Usuario creado exitosamente");
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        Contrasena: "",
        Rol: "READER",
        area: "",
      });
      setShowCreateForm(false);
      fetchUsuarios();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to Crear Usuario");
    }
  };

  const handleEliminarUsuario = async (UsuarioId: string) => {
    if (!window.confirm("Are you sure you want to Eliminar this Usuario?")) return;

    try {
      await apiService.EliminarUsuario(UsuarioId);
      toast.success("Usuario Eliminard successfully");
      fetchUsuarios();
    } catch (error) {
      toast.error("Failed to Eliminar Usuario");
    }
  };

  const totalPaginas = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancelarar" : "Crear Usuario"}
        </Button>
      </div>

      {/* Crear Usuario Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateUsuario} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Correo"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Contrasena"
              type="Contrasena"
              value={formData.Contrasena}
              onChange={(e) => setFormData({ ...formData, Contrasena: e.target.value })}
              required
            />
            <Input
              label="Nombre"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Apellido"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
            <select
              value={formData.Rol}
              onChange={(e) => setFormData({ ...formData, Rol: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="ADMIN">Admin</option>
              <option value="QUALITY_MANAGER">Quality Manager</option>
              <option value="DOCUMENT_OWNER">Document Owner</option>
              <option value="REVerER">ReVerer</option>
              <option value="APPROVER">Approver</option>
              <option value="READER">Reader</option>
            </select>
            <Input
              label="Area"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
          </div>
          <Button type="submit">Crear Usuario</Button>
        </form>
      )}

      {/* Usuarios Table */}
      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Usuarios.map((Usuario) => (
                  <tr key={Usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {Usuario.firstName} {Usuario.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm">{Usuario.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-900">
                        {Usuario.Rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{Usuario.area}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEliminarUsuario(Usuario.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {(Pagina - 1) * limit + 1} to {Math.min(Pagina * limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina(Math.max(1, Pagina - 1))}
                disabled={Pagina === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1">
                Pagina {Pagina} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina(Math.min(totalPaginas, Pagina + 1))}
                disabled={Pagina === totalPaginas}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

