import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api.js";
import { useAuthStore } from "../store/auth.js";
import { Button } from "../components/Button.js";
import toast from "react-hot-toast";

const PRIVILEGED_ROLES = ["ADMIN", "QUALITY_MANAGER"];

const STATUS_LABELS: Record<string,string> = { DRAFT:"Borrador", IN_REVIEW:"En Revisión", APPROVED:"Aprobado", PUBLISHED:"Publicado", OBSOLETE:"Obsoleto" };
const STATUS_COLORS: Record<string,string> = {
  DRAFT:     "bg-gray-100 text-gray-700 border-gray-200",
  IN_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED:  "bg-blue-50 text-blue-700 border-blue-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OBSOLETE:  "bg-red-50 text-red-600 border-red-200",
};
const TYPE_LABELS: Record<string,string> = { SOP:"SOP", POLICY:"Política", WI:"Inst. Trabajo", FORM:"Formulario", RECORD:"Registro" };

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[status] || STATUS_COLORS.DRAFT}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// #7 Skeleton loaders
function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>{["Código","Título","Estado","Tipo","Área","Versión",""].map(h=><th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Array.from({length:7}).map((_,i)=>(
            <tr key={i} className="animate-pulse">
              <td className="px-5 py-4"><div className="h-3 w-28 bg-gray-200 rounded" /></td>
              <td className="px-5 py-4"><div className="h-3 w-48 bg-gray-200 rounded" /></td>
              <td className="px-5 py-4"><div className="h-5 w-20 bg-gray-200 rounded-full" /></td>
              <td className="px-5 py-4"><div className="h-3 w-16 bg-gray-200 rounded" /></td>
              <td className="px-5 py-4"><div className="h-3 w-20 bg-gray-200 rounded" /></td>
              <td className="px-5 py-4"><div className="h-3 w-10 bg-gray-200 rounded" /></td>
              <td className="px-5 py-4"><div className="h-3 w-8 bg-gray-200 rounded" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({length:8}).map((_,i)=>(
        <div key={i} className="animate-pulse bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-3 w-3/4 bg-gray-200 rounded" />
          <div className="flex gap-2 pt-1">
            <div className="h-3 w-12 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// #10 Empty state with illustration
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
      <div className="mx-auto w-24 h-24 mb-6">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="92" fill="#EFF6FF" stroke="#DBEAFE" strokeWidth="2"/>
          <rect x="60" y="52" width="80" height="100" rx="8" fill="white" stroke="#BFDBFE" strokeWidth="2.5"/>
          <line x1="76" y1="80" x2="124" y2="80" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round"/>
          <line x1="76" y1="96" x2="120" y2="96" stroke="#BFDBFE" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="76" y1="112" x2="108" y2="112" stroke="#BFDBFE" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="130" cy="135" r="22" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2"/>
          <path d="M122 135h16M130 127v16" stroke="#2563EB" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Sin resultados</h3>
          <p className="text-gray-500 text-sm mb-6">No se encontraron documentos con los filtros aplicados.</p>
          <button onClick={onClear} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Limpiar filtros
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Aún no hay documentos</h3>
          <p className="text-gray-500 text-sm mb-6">Empezá creando el primer documento del sistema.</p>
          <Link to="/documents/create" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Crear documento
          </Link>
        </>
      )}
    </div>
  );
}

export function DocumentsListPage() {
  const { user } = useAuthStore();
  const isRestricted = !!user && !PRIVILEGED_ROLES.includes(user.role) && !!user.area;
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: "", status: "", area: "", type: "" });
  const [viewMode, setViewMode] = useState<"table" | "cards">("table"); // #9 toggle
  const limit = 20;

  useEffect(() => { fetchDocuments(); }, [page, filters]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.listDocuments({ page, limit, ...filters });
      setDocuments(response.data.data.items);
      setTotal(response.data.data.total);
    } catch {
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

  const clearFilters = () => {
    setFilters({ search: "", status: "", area: "", type: "" });
    setPage(1);
  };

  const hasFilters = !!(filters.search || filters.status || filters.area || filters.type);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          {!isLoading && <p className="text-sm text-gray-500 mt-0.5">{total} documento{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}</p>}
        </div>
        <Link to="/documents/create"><Button>+ Nuevo documento</Button></Link>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
            <input
              name="search" value={filters.search} onChange={handleFilterChange}
              placeholder="Buscar documentos..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {/* Status */}
          <select name="status" value={filters.status} onChange={handleFilterChange}
            className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Todos los estados</option>
            <option value="DRAFT">Borrador</option>
            <option value="IN_REVIEW">En Revisión</option>
            <option value="APPROVED">Aprobado</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="OBSOLETE">Obsoleto</option>
          </select>
          {/* Area */}
          {isRestricted ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 whitespace-nowrap">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg>
              {user?.area}
            </div>
          ) : (
            <input name="area" value={filters.area} onChange={handleFilterChange}
              placeholder="Filtrar por área..."
              className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
            />
          )}
          {/* Type */}
          <select name="type" value={filters.type} onChange={handleFilterChange}
            className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Todos los tipos</option>
            <option value="SOP">SOP</option>
            <option value="POLICY">Política</option>
            <option value="WI">Inst. Trabajo</option>
            <option value="FORM">Formulario</option>
            <option value="RECORD">Registro</option>
          </select>
          {/* Clear */}
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Limpiar
            </button>
          )}
          {/* View toggle */}
          <div className="ml-auto flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("table")} title="Vista tabla"
              className={`p-2 transition-colors ${viewMode === "table" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6z" /></svg>
            </button>
            <button onClick={() => setViewMode("cards")} title="Vista tarjetas"
              className={`p-2 transition-colors ${viewMode === "cards" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm10 0a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V6zM4 16a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4zm10 0a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        viewMode === "table" ? <TableSkeleton /> : <CardsSkeleton />
      ) : documents.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Código","Título","Estado","Tipo","Área","Versión",""].map(h=>(
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map((doc) => (
                <tr key={doc.id} className="group hover:bg-blue-50/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{doc.code}</span>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <span className="text-sm text-gray-900 font-medium line-clamp-1">{doc.title}</span>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={doc.status} /></td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{TYPE_LABELS[doc.type] || doc.type}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{doc.area || "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{doc.currentVersionLabel}</td>
                  <td className="px-5 py-3.5">
                    <Link to={`/documents/${doc.id}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Mostrando {(page-1)*limit+1}–{Math.min(page*limit,total)} de {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage(Math.max(1,page-1))} disabled={page===1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-white transition-colors">‹ Anterior</button>
              <span className="px-3 py-1.5 text-xs text-gray-600">{page} / {totalPages}</span>
              <button onClick={()=>setPage(Math.min(totalPages,page+1))} disabled={page===totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-white transition-colors">Siguiente ›</button>
            </div>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <Link key={doc.id} to={`/documents/${doc.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{doc.code}</span>
                  <StatusBadge status={doc.status} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">{doc.title}</h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-auto">
                  <span className="text-xs text-gray-500">{TYPE_LABELS[doc.type] || doc.type}</span>
                  {doc.area && <span className="text-xs text-gray-400">· {doc.area}</span>}
                  <span className="text-xs text-gray-400 ml-auto">v{doc.currentVersionLabel}</span>
                </div>
              </Link>
            ))}
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3.5">
            <p className="text-xs text-gray-500">
              Mostrando {(page-1)*limit+1}–{Math.min(page*limit,total)} de {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage(Math.max(1,page-1))} disabled={page===1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">‹ Anterior</button>
              <span className="px-3 py-1.5 text-xs text-gray-600">{page} / {totalPages}</span>
              <button onClick={()=>setPage(Math.min(totalPages,page+1))} disabled={page===totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Siguiente ›</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
