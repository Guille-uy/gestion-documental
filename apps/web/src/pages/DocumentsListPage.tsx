import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api.js";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<string,string> = { DRAFT:"Borrador", IN_REVIEW:"En Revision", APPROVED:"Aprobado", PUBLISHED:"Publicado", OBSOLETE:"Obsoleto" };
const STATUS_COLORS: Record<string,string> = { DRAFT:"bg-gray-100 text-gray-900", IN_REVIEW:"bg-yellow-100 text-yellow-900", APPROVED:"bg-blue-100 text-blue-900", PUBLISHED:"bg-green-100 text-green-900", OBSOLETE:"bg-red-100 text-red-900" };

function StatusBadge({ status }: { status: string }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS.DRAFT}`}>{STATUS_LABELS[status] || status}</span>;
}

export function DocumentsListPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: "", status: "", area: "", type: "" });
  const limit = 20;

  useEffect(() => { fetchDocuments(); }, [page, filters]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.listDocuments({ page, limit, ...filters });
      setDocuments(response.data.data.items);
      setTotal(response.data.data.total);
    } catch (error) {
      toast.error("Error al cargar documentos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
        <Link to="/documents/create"><Button>Crear Documento</Button></Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input placeholder="Buscar documentos..." name="search" value={filters.search} onChange={handleFilterChange} />
          <select name="status" value={filters.status} onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los estados</option>
            <option value="DRAFT">Borrador</option>
            <option value="IN_REVIEW">En Revision</option>
            <option value="APPROVED">Aprobado</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="OBSOLETE">Obsoleto</option>
          </select>
          <Input placeholder="Filtrar por area..." name="area" value={filters.area} onChange={handleFilterChange} />
          <select name="type" value={filters.type} onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los tipos</option>
            <option value="SOP">SOP</option>
            <option value="POLICY">Politica</option>
            <option value="WI">Instruccion de Trabajo</option>
            <option value="FORM">Formulario</option>
            <option value="RECORD">Registro</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No se encontraron documentos</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Codigo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titulo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{doc.code}</td>
                    <td className="px-6 py-4 text-sm">{doc.title}</td>
                    <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                    <td className="px-6 py-4 text-sm">{doc.type}</td>
                    <td className="px-6 py-4 text-sm">{doc.area}</td>
                    <td className="px-6 py-4 text-sm">{doc.currentVersionLabel}</td>
                    <td className="px-6 py-4">
                      <Link to={`/documents/${doc.id}`} className="text-blue-600 hover:underline text-sm">Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
              <span className="px-3 py-1">Pagina {page} de {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
