import React, { useEffect, useState } from "react";
import { apiService } from "../services/api.js";
import toast from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";

// #13 Action labels + colour map
const ACTION_META: Record<string, { label: string; color: string }> = {
  LOGIN:             { label: "Inicio de sesión",   color: "bg-gray-100 text-gray-700 border-gray-200" },
  LOGOUT:            { label: "Cierre de sesión",   color: "bg-gray-100 text-gray-700 border-gray-200" },
  CREATE_DOCUMENT:   { label: "Crear documento",    color: "bg-blue-50 text-blue-700 border-blue-200" },
  UPDATE_DOCUMENT:   { label: "Editar documento",   color: "bg-amber-50 text-amber-700 border-amber-200" },
  PUBLISH_DOCUMENT:  { label: "Publicar documento", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  DOWNLOAD_DOCUMENT: { label: "Descargar",          color: "bg-purple-50 text-purple-700 border-purple-200" },
  SUBMIT_FOR_REVIEW: { label: "Enviar a revisión",  color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  APPROVE_REVIEW:    { label: "Aprobar revisión",   color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REQUEST_CHANGES:   { label: "Solicitar cambios",  color: "bg-red-50 text-red-600 border-red-200" },
  CONFIRM_READ:      { label: "Confirmar lectura",  color: "bg-teal-50 text-teal-700 border-teal-200" },
  DELETE_DOCUMENT:   { label: "Eliminar documento", color: "bg-red-50 text-red-700 border-red-200" },
};

// #7 Skeleton
function LogSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>{["Fecha","Usuario","Acción","Entidad","ID"].map(h=>(
            <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
          ))}</tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Array.from({length:8}).map((_,i)=>(
            <tr key={i} className="animate-pulse">
              <td className="px-5 py-4"><div className="h-3 w-28 bg-gray-200 rounded mb-1"/><div className="h-2.5 w-20 bg-gray-100 rounded"/></td>
              <td className="px-5 py-4"><div className="h-3 w-24 bg-gray-200 rounded mb-1"/><div className="h-2.5 w-32 bg-gray-100 rounded"/></td>
              <td className="px-5 py-4"><div className="h-5 w-28 bg-gray-200 rounded-full"/></td>
              <td className="px-5 py-4"><div className="h-3 w-16 bg-gray-200 rounded"/></td>
              <td className="px-5 py-4"><div className="h-3 w-24 bg-gray-100 rounded"/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuditLogsPagina() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [Pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ action: "", userId: "", entityType: "", dateFrom: "", dateTo: "" });
  const [exporting, setExporting] = useState(false);
  const limit = 50;

  useEffect(() => { fetchLogs(); }, [Pagina, filters]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAuditLogs({ page: Pagina, limit, ...filters, from: filters.dateFrom || undefined, to: filters.dateTo || undefined });
      setLogs(response.data.data.items);
      setTotal(response.data.data.total);
    } catch {
      toast.error("Error al cargar Registros de Auditoría");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagina(1);
  };

  // #13 CSV export
  const exportCSV = async () => {
    try {
      setExporting(true);
      const response = await apiService.getAuditLogs({ page: 1, limit: 5000, ...filters, from: filters.dateFrom || undefined, to: filters.dateTo || undefined });
      const items: any[] = response.data.data.items;
      const header = ["Fecha","Hora","Usuario","Email","Acción","Entidad","EntityID"];
      const rows = items.map(l => [
        format(new Date(l.createdAt), "dd/MM/yyyy"),
        format(new Date(l.createdAt), "HH:mm:ss"),
        `${l.user?.firstName || ""} ${l.user?.lastName || ""}`.trim(),
        l.user?.email || "",
        ACTION_META[l.action]?.label || l.action,
        l.entityType || "",
        l.entityId || "",
      ]);
      const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `auditoria_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exportado correctamente");
    } catch {
      toast.error("Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  const totalPaginas = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registros de Auditoría</h1>
          {!isLoading && <p className="text-sm text-gray-500 mt-0.5">{total} registro{total !== 1 ? "s" : ""}</p>}
        </div>
        {/* #13 CSV Export */}
        <button onClick={exportCSV} disabled={exporting || isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors">
          {exporting ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M8 12l4 4m0 0l4-4m-4 4V4" /></svg>
          )}
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select name="action" value={filters.action} onChange={handleFilterChange}
            className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Todas las acciones</option>
            {Object.entries(ACTION_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input name="userId" value={filters.userId} onChange={handleFilterChange}
            placeholder="Filtrar por ID de usuario..."
            className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          />
          <input name="entityType" value={filters.entityType} onChange={handleFilterChange}
            placeholder="Tipo de entidad..."
            className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Desde</label>
            <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange}
              className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Hasta</label>
            <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange}
              className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LogSkeleton />
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <p className="text-gray-500">No se encontraron registros</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Fecha y hora","Usuario","Acción","Entidad","Entity ID"].map(h=>(
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => {
                const meta = ACTION_META[log.action];
                return (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="text-gray-900 text-xs font-medium">{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm")}</p>
                      <p className="text-gray-400 text-xs">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-gray-900 font-medium text-xs">{log.user?.firstName} {log.user?.lastName}</p>
                      <p className="text-gray-400 text-xs">{log.user?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ meta ? meta.color : "bg-gray-100 text-gray-700 border-gray-200"}`}>
                        {meta?.label || log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 whitespace-nowrap">{log.entityType || "—"}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400 whitespace-nowrap">{log.entityId ? log.entityId.slice(0,16)+"…" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Mostrando {(Pagina-1)*limit+1}–{Math.min(Pagina*limit,total)} de {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPagina(Math.max(1,Pagina-1))} disabled={Pagina===1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-white transition-colors">‹ Anterior</button>
              <span className="px-3 py-1.5 text-xs text-gray-600">{Pagina} / {totalPaginas}</span>
              <button onClick={()=>setPagina(Math.min(totalPaginas,Pagina+1))} disabled={Pagina===totalPaginas}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-white transition-colors">Siguiente ›</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { AuditLogsPagina as AuditLogsPage };
