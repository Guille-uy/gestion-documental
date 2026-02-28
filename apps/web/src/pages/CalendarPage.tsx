import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api.js";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "bg-emerald-500",
  DRAFT: "bg-gray-400",
  IN_REVIEW: "bg-amber-500",
  APPROVED: "bg-blue-500",
  OBSOLETE: "bg-red-400",
};

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      // Fetch all published docs with nextReviewDate
      const response = await apiService.listDocuments({ page: 1, limit: 200, status: "PUBLISHED" });
      const all = response.data.data.items.filter((d: any) => d.nextReviewDate);
      setDocuments(all);
    } catch {
      toast.error("Error al cargar documentos");
    } finally {
      setIsLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad with empty days to align to Mon start (getDay returns 0=Sun)
  const startPad = (getDay(monthStart) + 6) % 7; // 0=Mon
  const emptyStart = Array.from({ length: startPad });

  // Group docs by day
  const docsByDay: Record<string, any[]> = {};
  documents.forEach((doc) => {
    if (!doc.nextReviewDate) return;
    const key = format(new Date(doc.nextReviewDate), "yyyy-MM-dd");
    if (!docsByDay[key]) docsByDay[key] = [];
    docsByDay[key].push(doc);
  });

  const docsForSelectedDay = selectedDay
    ? docsByDay[format(selectedDay, "yyyy-MM-dd")] ?? []
    : [];

  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario de revisiones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Fechas de revisión programadas para documentos publicados</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-base font-semibold text-gray-900 w-44 text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </span>
          <button
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            className="ml-2 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Hoy
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar grid */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <div key={d} className="py-3 text-xs font-semibold text-gray-500 text-center">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7">
              {emptyStart.map((_, i) => (
                <div key={`empty-${i}`} className="border-r border-b border-gray-50 min-h-[80px]" />
              ))}
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const docs = docsByDay[key] ?? [];
                const dayToday = isToday(day);
                const selected = selectedDay && isSameDay(day, selectedDay);
                const daysFromToday = differenceInDays(day, today);

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedDay(selected ? null : day)}
                    className={`border-r border-b border-gray-50 min-h-[80px] p-1.5 cursor-pointer transition-colors hover:bg-blue-50/40 ${
                      selected ? "bg-blue-50 ring-2 ring-inset ring-blue-400" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          dayToday
                            ? "bg-blue-600 text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      {docs.length > 0 && (
                        <span className="text-[10px] font-bold text-gray-400">{docs.length}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {docs.slice(0, 3).map((doc) => (
                        <div
                          key={doc.id}
                          title={`${doc.code} — ${doc.title}`}
                          className={`w-full h-1.5 rounded-full ${
                            daysFromToday < 0
                              ? "bg-red-400"
                              : daysFromToday <= 7
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`}
                        />
                      ))}
                      {docs.length > 3 && (
                        <span className="text-[9px] text-gray-400">+{docs.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 overflow-y-auto max-h-[600px]">
            {selectedDay ? (
              <>
                <h2 className="text-sm font-bold text-gray-900 mb-1 capitalize">
                  {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
                </h2>
                {docsForSelectedDay.length === 0 ? (
                  <p className="text-sm text-gray-400 mt-4">Sin revisiones este día.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {docsForSelectedDay.map((doc) => {
                      const daysLeft = differenceInDays(new Date(doc.nextReviewDate), today);
                      const isOverdue = daysLeft < 0;
                      const isCritical = daysLeft <= 7;
                      return (
                        <Link
                          key={doc.id}
                          to={`/documents/${doc.id}`}
                          className={`block rounded-lg p-3 border transition-colors hover:shadow-sm ${
                            isOverdue
                              ? "border-red-200 bg-red-50"
                              : isCritical
                              ? "border-amber-200 bg-amber-50"
                              : "border-gray-100 bg-gray-50"
                          }`}
                        >
                          <p className="text-xs font-mono text-gray-500 mb-0.5">{doc.code}</p>
                          <p className="text-sm font-medium text-gray-900 leading-tight">{doc.title}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs text-gray-500">{doc.area}</span>
                            <span
                              className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                isOverdue
                                  ? "bg-red-100 text-red-700"
                                  : isCritical
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {isOverdue
                                ? `Vencido ${Math.abs(daysLeft)}d`
                                : daysLeft === 0
                                ? "Hoy"
                                : `${daysLeft}d`}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-sm font-bold text-gray-900 mb-4">Próximas revisiones</h2>
                <div className="space-y-2">
                  {documents
                    .filter((d) => differenceInDays(new Date(d.nextReviewDate), today) <= 30)
                    .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime())
                    .slice(0, 10)
                    .map((doc) => {
                      const daysLeft = differenceInDays(new Date(doc.nextReviewDate), today);
                      const isOverdue = daysLeft < 0;
                      return (
                        <Link
                          key={doc.id}
                          to={`/documents/${doc.id}`}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-mono text-gray-400">{doc.code}</p>
                            <p className="text-xs font-medium text-gray-800 truncate">{doc.title}</p>
                          </div>
                          <span
                            className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
                              isOverdue
                                ? "bg-red-100 text-red-700"
                                : daysLeft <= 7
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {isOverdue ? `-${Math.abs(daysLeft)}d` : `${daysLeft}d`}
                          </span>
                        </Link>
                      );
                    })}
                  {documents.filter((d) => differenceInDays(new Date(d.nextReviewDate), today) <= 30).length === 0 && (
                    <p className="text-sm text-gray-400">No hay revisiones en los próximos 30 días.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><span>Vencido</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-400" /><span>≤ 7 días</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-400" /><span>Próximos</span></div>
      </div>
    </div>
  );
}
