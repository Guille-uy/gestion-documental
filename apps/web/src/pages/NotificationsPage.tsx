import React, { useEffect, useState } from "react";
import { apiService } from "../services/api.js";
import { Button } from "../components/Button.js";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type Tab = "activas" | "archivadas";

export function NotificacionesPagina() {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [soloSinLeer, setSoloSinLeer] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [tab, setTab] = useState<Tab>("activas");

  const limit = 20;

  useEffect(() => {
    fetchNotificaciones();
  }, [pagina, soloSinLeer, tipoFiltro, tab]);

  const fetchNotificaciones = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: pagina, limit };
      if (tab === "archivadas") {
        params.archivedOnly = true;
      } else {
        params.unreadOnly = soloSinLeer;
      }
      if (tipoFiltro) params.type = tipoFiltro;
      const response = await apiService.getNotifications(params);
      setNotificaciones(response.data.data.items);
      setTotal(response.data.data.total);
    } catch (error) {
      toast.error("Error al cargar notificaciones");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarcarLeida = async (notificacionId: string) => {
    try {
      await apiService.markNotificationAsRead(notificacionId);
      setNotificaciones((prev) =>
        prev.map((n) => n.id === notificacionId ? { ...n, readAt: new Date() } : n)
      );
    } catch {
      toast.error("Error al marcar como leída");
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch {
      toast.error("Error al marcar todas como leídas");
    }
  };

  const handleArchivar = async (notificacionId: string) => {
    try {
      await apiService.archiveNotification(notificacionId);
      setNotificaciones((prev) => prev.filter((n) => n.id !== notificacionId));
      toast.success("Notificación archivada");
    } catch {
      toast.error("Error al archivar la notificación");
    }
  };

  const handleRestaurar = async (notificacionId: string) => {
    try {
      await apiService.restoreNotification(notificacionId);
      setNotificaciones((prev) => prev.filter((n) => n.id !== notificacionId));
      toast.success("Notificación restaurada");
    } catch {
      toast.error("Error al restaurar la notificación");
    }
  };

  const totalPaginas = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
        {tab === "activas" && (
          <Button onClick={handleMarcarTodasLeidas} variant="secondary" size="sm">
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {(["activas", "archivadas"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPagina(1); setSoloSinLeer(false); }}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "activas" ? "Activas" : "Archivadas"}
            </button>
          ))}
        </nav>
      </div>

      {/* Filter — only in active tab */}
      {tab === "activas" && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={soloSinLeer}
                onChange={(e) => { setSoloSinLeer(e.target.checked); setPagina(1); }}
                className="rounded"
              />
              <span className="text-sm font-medium">Mostrar solo sin leer</span>
            </label>
            <select value={tipoFiltro} onChange={(e) => { setTipoFiltro(e.target.value); setPagina(1); }}
              className="py-1.5 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Todos los tipos</option>
              <option value="REVIEW_REMINDER">Recordatorio de revisión</option>
              <option value="DOCUMENT_SUBMITTED">Documento enviado</option>
              <option value="DOCUMENT_APPROVED">Documento aprobado</option>
              <option value="DOCUMENT_PUBLISHED">Documento publicado</option>
              <option value="REVIEW_REQUESTED">Revisión requerida</option>
              <option value="DOCUMENT_REJECTED">Documento rechazado</option>
            </select>
          </div>
        </div>
      )}

      {tab === "archivadas" && (
        <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Las notificaciones archivadas se conservan como historial. Podés restaurarlas en cualquier momento.
        </p>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : notificaciones.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 text-sm">
            {tab === "archivadas" ? "No hay notificaciones archivadas" : "No hay notificaciones"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificaciones.map((notificacion) => (
            <div
              key={notificacion.id}
              className={`p-4 rounded-lg border-l-4 flex items-start justify-between gap-4 ${
                tab === "archivadas"
                  ? "bg-gray-50 border-gray-300 opacity-75"
                  : notificacion.readAt
                  ? "bg-gray-50 border-gray-300"
                  : "bg-blue-50 border-blue-500"
              }`}
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm">{notificacion.title}</h3>
                <p className="text-gray-600 text-sm mt-0.5">{notificacion.message}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {formatDistanceToNow(new Date(notificacion.createdAt), { addSuffix: true, locale: es })}
                </p>
              </div>

              <div className="flex gap-1 shrink-0">
                {tab === "activas" ? (
                  <>
                    {!notificacion.readAt && (
                      <button
                        onClick={() => handleMarcarLeida(notificacion.id)}
                        className="p-1.5 hover:bg-green-100 rounded text-green-600 text-xs"
                        title="Marcar como leída"
                      >
                        ✓ Listo
                      </button>
                    )}
                    <button
                      onClick={() => handleArchivar(notificacion.id)}
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-500 text-xs"
                      title="Archivar (se guarda en historial)"
                    >
                      🗄 Archivar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleRestaurar(notificacion.id)}
                    className="p-1.5 hover:bg-blue-100 rounded text-blue-600 text-xs"
                    title="Restaurar a notificaciones activas"
                  >
                    ↩ Restaurar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-600">
            Mostrando {(pagina - 1) * limit + 1} a {Math.min(pagina * limit, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina(Math.max(1, pagina - 1))}
              disabled={pagina === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm">Página {pagina} de {totalPaginas}</span>
            <button
              onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
              disabled={pagina === totalPaginas}
              className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Alias para compatibilidad con App.tsx
export { NotificacionesPagina as NotificationsPage };
