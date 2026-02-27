import React, { useEffect, useState } from "react";
import { apiService } from "../services/api.js";
import { Button } from "../components/Button.js";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { es } from "date-fns/locale";

export function NotificacionesPagina() {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [soloSinLeer, setSoloSinLeer] = useState(false);

  const limit = 20;

  useEffect(() => {
    fetchNotificaciones();
  }, [pagina, soloSinLeer]);

  const fetchNotificaciones = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getNotificaciones({
        page: pagina,
        limit,
        unreadOnly: soloSinLeer,
      });
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
        prev.map((n) =>
          n.id === notificacionId ? { ...n, readAt: new Date() } : n
        )
      );
    } catch (error) {
      toast.error("Error al marcar como leída");
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await apiService.markAllNotificacionesAsRead();
      setNotificaciones((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date() }))
      );
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch (error) {
      toast.error("Error al marcar todas como leídas");
    }
  };

  const handleEliminar = async (notificacionId: string) => {
    try {
      await apiService.EliminarNotification(notificacionId);
      setNotificaciones((prev) => prev.filter((n) => n.id !== notificacionId));
      toast.success("Notificación eliminada");
    } catch (error) {
      toast.error("Error al eliminar notificación");
    }
  };

  const totalPaginas = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
        <Button onClick={handleMarcarTodasLeidas} variant="secondary" size="sm">
          Marcar todas como leídas
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={soloSinLeer}
            onChange={(e) => {
              setSoloSinLeer(e.target.checked);
              setPagina(1);
            }}
            className="rounded"
          />
          <span className="text-sm font-medium">Mostrar solo sin leer</span>
        </label>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : notificaciones.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No hay notificaciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((notificacion) => (
            <div
              key={notificacion.id}
              className={`p-4 rounded-lg border-l-4 flex items-start justify-between ${
                notificacion.readAt
                  ? "bg-gray-50 border-gray-300"
                  : "bg-blue-50 border-blue-500"
              }`}
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {notificacion.title}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {notificacion.message}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {formatDistanceToNow(new Date(notificacion.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>

              <div className="flex gap-2 ml-4">
                {!notificacion.readAt && (
                  <button
                    onClick={() => handleMarcarLeida(notificacion.id)}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Marcar como leída"
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => handleEliminar(notificacion.id)}
                  className="p-2 hover:bg-red-200 rounded text-red-600"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-600">
            Mostrando {(pagina - 1) * limit + 1} a{" "}
            {Math.min(pagina * limit, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina(Math.max(1, pagina - 1))}
              disabled={pagina === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
              disabled={pagina === totalPaginas}
              className="px-3 py-1 border rounded disabled:opacity-50"
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

