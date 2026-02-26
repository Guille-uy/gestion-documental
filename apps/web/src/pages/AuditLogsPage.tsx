import React, { useEffect, useState } from "react";
import { apiService } from "../services/api.js";
import { Input } from "../components/Input.js";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

export function AuditLogsPagina() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [Pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    Accion: "",
    UsuarioId: "",
    entityType: "",
  });

  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [Pagina, filters]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAuditLogs({
        Pagina,
        limit,
        ...filters,
      });
      setLogs(response.data.data.items);
      setTotal(response.data.data.total);
    } catch (error) {
      toast.error("Error al cargar Registros de Auditoria");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagina(1);
  };

  const totalPaginas = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Registros de Auditoria</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            name="Accion"
            value={filters.Accion}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las acciones</option>
            <option value="LOGIN">Login</option>
            <option value="CREATE_DOCUMENT">Create Document</option>
            <option value="UPDATE_DOCUMENT">Update Document</option>
            <option value="PUBLISH_DOCUMENT">Publish Document</option>
            <option value="DOWNLOAD_DOCUMENT">Download Document</option>
            <option value="CREATE_Usuario">Crear Usuario</option>
            <option value="UPDATE_Usuario">Update Usuario</option>
            <option value="Eliminar_Usuario">Eliminar Usuario</option>
            <option value="SUBMIT_FOR_REVer">Submit for ReVer</option>
            <option value="APPROVE_REVer">Approve ReVer</option>
            <option value="REQUEST_CHANGES">Request Changes</option>
          </select>

          <Input
            placeholder="Filter by Usuario ID..."
            name="UsuarioId"
            value={filters.UsuarioId}
            onChange={handleFilterChange}
          />

          <Input
            placeholder="Filter by entity type..."
            name="entityType"
            value={filters.entityType}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No se encontraron registros</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha y Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">
                        {log.Usuario.firstName} {log.Usuario.lastName}
                      </span>
                      <p className="text-gray-500 text-xs">{log.Usuario.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-900">
                        {log.Accion}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{log.entityType}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                      {log.entityId || "-"}
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

