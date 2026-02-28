import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api.js";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const TYPE_LABELS: Record<string, string> = {
  SOP: "SOP", POLICY: "Política", WI: "Instrucción de Trabajo",
  FORM: "Formulario", RECORD: "Registro",
};

const TYPE_COLORS: Record<string, string> = {
  SOP: "bg-blue-50 text-blue-700",
  POLICY: "bg-purple-50 text-purple-700",
  WI: "bg-amber-50 text-amber-700",
  FORM: "bg-green-50 text-green-700",
  RECORD: "bg-gray-50 text-gray-700",
};

export function MyTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const res = await apiService.getMyTasks();
      setTasks((res.data as any).data ?? []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Tareas Pendientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Documentos que requieren tu revisión o aprobación
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
          tasks.length === 0 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
        }`}>
          {tasks.length === 0 ? "Al día ✓" : `${tasks.length} pendiente${tasks.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Sin tareas pendientes</h3>
          <p className="text-gray-500 text-sm">No tenés documentos esperando tu revisión en este momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Link
              key={task.id}
              to={`/documents/${task.document.id}`}
              className="block bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Doc type badge + code */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[task.document.type] ?? "bg-gray-100 text-gray-600"}`}>
                      {TYPE_LABELS[task.document.type] ?? task.document.type}
                    </span>
                    <span className="text-xs font-mono text-gray-400">{task.document.code}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {task.document.title}
                  </h3>

                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {task.document.area}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Versión {task.document.currentVersionLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Asignado {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>

                {/* CTA arrow */}
                <div className="shrink-0 flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:gap-3 transition-all">
                  <span className="hidden sm:inline">Revisar</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Urgency indicator */}
              {(() => {
                const days = Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 86400000);
                if (days >= 3) {
                  return (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      En espera hace {days} día{days !== 1 ? "s" : ""}
                    </div>
                  );
                }
                return null;
              })()}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
