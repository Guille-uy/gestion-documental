import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api.js";
import { useAuthStore } from "../store/auth.js";
import toast from "react-hot-toast";
import { differenceInDays, formatDistanceToNow, format, isAfter, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardData {
  total: number;
  draft: number;
  inReview: number;
  published: number;
  obsolete: number;
  stale7: number;          // IN_REVIEW > 7 days without update
  stale14: number;         // IN_REVIEW > 14 days without update
  publishedThisMonth: number;
  unreadNotifications: number;
  byArea: { name: string; count: number }[];
  staleDocsDetail: { id: string; code: string; title: string; days: number }[];
  expiringDocs: { id: string; code: string; title: string; daysLeft: number }[];
  recentDocs: any[];
  auditLogs: any[];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [docsRes, unreadRes] = await Promise.all([
          apiService.listDocuments({ page: 1, limit: 100 }),
          apiService.getUnreadCount(),
        ]);

        // Audit logs only accessible for ADMIN / QUALITY_MANAGER
        let auditItems: any[] = [];
        try {
          const auditRes = await apiService.getAuditLogs({ page: 1, limit: 6 });
          auditItems = auditRes.data.data.items ?? [];
        } catch {
          // silently skip for roles without audit access
        }

        const docs: any[] = docsRes.data.data.items;
        const now = new Date();
        const monthStart = startOfMonth(now);

        // Status counts
        const draft = docs.filter((d) => d.status === "DRAFT").length;
        const inReview = docs.filter((d) => d.status === "IN_REVIEW").length;
        const published = docs.filter((d) => d.status === "PUBLISHED").length;
        const obsolete = docs.filter((d) => d.status === "OBSOLETE").length;

        // Stale reviews (IN_REVIEW with no update for X days)
        const reviewDocs = docs.filter((d) => d.status === "IN_REVIEW");
        const stale7 = reviewDocs.filter(
          (d) => differenceInDays(now, new Date(d.updatedAt)) >= 7
        ).length;
        const stale14 = reviewDocs.filter(
          (d) => differenceInDays(now, new Date(d.updatedAt)) >= 14
        ).length;
        const staleDocsDetail = reviewDocs
          .map((d) => ({
            id: d.id,
            code: d.code,
            title: d.title,
            days: differenceInDays(now, new Date(d.updatedAt)),
          }))
          .filter((d) => d.days >= 3)
          .sort((a, b) => b.days - a.days)
          .slice(0, 4);

        // Published this month
        const publishedThisMonth = docs.filter(
          (d) => d.status === "PUBLISHED" && isAfter(new Date(d.updatedAt), monthStart)
        ).length;

        // By area
        const areaMap: Record<string, number> = {};
        docs.forEach((d) => {
          const area = d.area || "Sin área";
          areaMap[area] = (areaMap[area] || 0) + 1;
        });
        const byArea = Object.entries(areaMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        // #11 Expiring documents (nextReviewDate within 30 days)
        const expiringDocs = docs
          .filter(d => d.nextReviewDate && differenceInDays(new Date(d.nextReviewDate), now) <= 30 && differenceInDays(new Date(d.nextReviewDate), now) >= -1)
          .map(d => ({ id: d.id, code: d.code, title: d.title, daysLeft: differenceInDays(new Date(d.nextReviewDate), now) }))
          .sort((a, b) => a.daysLeft - b.daysLeft)
          .slice(0, 6);

        setData({
          total: docsRes.data.data.total,
          draft,
          inReview,
          published,
          obsolete,
          stale7,
          stale14,
          publishedThisMonth,
          unreadNotifications: unreadRes.data.data.count ?? 0,
          byArea,
          staleDocsDetail,
          expiringDocs,
          recentDocs: docs.slice(0, 5),
          auditLogs: auditItems,
        });
      } catch {
        toast.error("Error al cargar el panel");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const today = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es });

  // Health score: 100 - 15*stale14 - 8*stale7 - 5*draft (min 0)
  const health = data
    ? Math.max(0, 100 - data.stale14 * 15 - data.stale7 * 8 - Math.min(data.draft * 2, 20))
    : 100;
  const healthLabel = health >= 80 ? "Excelente" : health >= 50 ? "Regular" : "Crítico";
  const healthColor = health >= 80 ? "from-emerald-500 to-teal-500" : health >= 50 ? "from-amber-500 to-orange-500" : "from-red-500 to-rose-600";
  const healthDot = health >= 80 ? "bg-emerald-400" : health >= 50 ? "bg-amber-400" : "bg-red-400";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando panel…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, {user?.firstName}
          </h1>
          <p className="text-sm text-gray-500 capitalize mt-0.5">{today}</p>
        </div>
        <Link
          to="/documents/create"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo documento
        </Link>
      </div>

      {/* ── KPI Cards (dark gradient style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Card 1 – Salud del sistema */}
        <GradientCard gradient={healthColor}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconBox gradient={healthColor}>
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </IconBox>
              <h3 className="text-sm font-semibold text-gray-900">Salud del sistema</h3>
            </div>
            <LiveBadge dot={healthDot} label={healthLabel} />
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold text-gray-900">{health}</span>
            <span className="text-gray-400 text-sm mb-1">/ 100</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${healthColor} transition-all duration-700`}
              style={{ width: `${health}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {data.stale14 > 0
              ? `${data.stale14} revisión${data.stale14 > 1 ? "es" : ""} crítica${data.stale14 > 1 ? "s" : ""} (>14 días)`
              : data.stale7 > 0
              ? `${data.stale7} revisión${data.stale7 > 1 ? "es" : ""} demorada${data.stale7 > 1 ? "s" : ""} (>7 días)`
              : "Sin revisiones estancadas"}
          </p>
        </GradientCard>

        {/* Card 2 – Revisiones pendientes */}
        <GradientCard gradient="from-violet-500 via-purple-500 to-fuchsia-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconBox gradient="from-violet-500 to-purple-500">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </IconBox>
              <h3 className="text-sm font-semibold text-gray-900">En revisión</h3>
            </div>
            {data.stale7 > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-1 text-xs font-medium text-amber-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                {data.stale7} demorado{data.stale7 > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">{data.inReview}</p>
          <p className="text-xs text-gray-500 mb-3">documento{data.inReview !== 1 ? "s" : ""} esperando revisión</p>
          {data.staleDocsDetail.length > 0 ? (
            <div className="space-y-1.5">
              {data.staleDocsDetail.map((d) => (
                <Link key={d.id} to={`/documents/${d.id}`} className="flex items-center justify-between rounded-md bg-gray-50 border border-gray-100 px-2.5 py-1.5 hover:bg-gray-100 transition-colors">
                  <span className="text-xs text-gray-700 truncate max-w-[140px]">{d.code}</span>
                  <span className={`text-xs font-medium shrink-0 ml-2 ${d.days >= 14 ? "text-red-500" : d.days >= 7 ? "text-amber-600" : "text-gray-400"}`}>
                    {d.days}d
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-600 font-medium">✓ Todo al día</p>
          )}
        </GradientCard>

        {/* Card 3 – Notificaciones */}
        <GradientCard gradient="from-blue-500 via-cyan-500 to-sky-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconBox gradient="from-blue-500 to-cyan-500">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </IconBox>
              <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
            </div>
            <Link
              to="/notifications"
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              Ver todas →
            </Link>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">{data.unreadNotifications}</p>
          <p className="text-xs text-gray-500 mb-4">sin leer</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Borrador", val: data.draft, color: "text-gray-700" },
              { label: "Revisión", val: data.inReview, color: "text-amber-600" },
              { label: "Publicado", val: data.published, color: "text-emerald-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-md bg-gray-50 border border-gray-100 p-2 text-center">
                <p className={`text-base font-bold ${s.color}`}>{s.val}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </GradientCard>

        {/* Card 4 – Publicados este mes */}
        <GradientCard gradient="from-emerald-500 via-teal-500 to-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconBox gradient="from-emerald-500 to-teal-500">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </IconBox>
              <h3 className="text-sm font-semibold text-gray-900">Publicados</h3>
            </div>
            <span className="text-xs text-gray-500 capitalize font-medium">
              {format(new Date(), "MMM", { locale: es })}
            </span>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">{data.publishedThisMonth}</p>
          <p className="text-xs text-gray-500 mb-3">este mes</p>
          <div className="rounded-md bg-gray-50 border border-gray-100 p-2.5">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Total en producción</span>
              <span className="text-gray-900 font-semibold">{data.published}</span>
            </div>
            {/* mini bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                style={{ width: `${data.total > 0 ? Math.round((data.published / data.total) * 100) : 0}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {data.total > 0 ? Math.round((data.published / data.total) * 100) : 0}% del total publicado
            </p>
          </div>
        </GradientCard>
      </div>

      {/* ── #11 Revisiones próximas (expiry alerts) ── */}
      {data.expiringDocs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-base">📅</span>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Revisiones próximas</h2>
                <p className="text-xs text-gray-500">Documentos con fecha de revisión en los próximos 30 días</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {data.expiringDocs.length} pendiente{data.expiringDocs.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.expiringDocs.map(d => {
              const isOverdue = d.daysLeft < 0;
              const isCritical = d.daysLeft <= 7;
              const isWarning = d.daysLeft <= 14;
              const color = isOverdue || isCritical ? "border-red-200 bg-red-50" : isWarning ? "border-amber-200 bg-amber-50" : "border-blue-100 bg-blue-50";
              const badge = isOverdue ? "bg-red-100 text-red-700" : isCritical ? "bg-red-50 text-red-600" : isWarning ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700";
              const label = isOverdue ? "Vencido" : d.daysLeft === 0 ? "Hoy" : `${d.daysLeft}d`;
              return (
                <Link key={d.id} to={`/documents/${d.id}`}
                  className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 hover:shadow-sm transition-all ${color}`}>
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-gray-500">{d.code}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                  </div>
                  <span className={`ml-3 shrink-0 text-xs font-bold px-2 py-1 rounded-md ${badge}`}>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Distribución por estado – 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Distribución por estado</h2>
              <p className="text-xs text-gray-500 mt-0.5">{data.total} documentos en total</p>
            </div>
            <Link to="/documents" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { label: "Publicados", val: data.published, max: data.total, color: "bg-emerald-500", textColor: "text-emerald-700", bg: "bg-emerald-50" },
              { label: "En Revisión", val: data.inReview, max: data.total, color: data.stale7 > 0 ? "bg-amber-500" : "bg-blue-500", textColor: data.stale7 > 0 ? "text-amber-700" : "text-blue-700", bg: data.stale7 > 0 ? "bg-amber-50" : "bg-blue-50" },
              { label: "Borradores", val: data.draft, max: data.total, color: "bg-gray-400", textColor: "text-gray-600", bg: "bg-gray-50" },
              { label: "Obsoletos", val: data.obsolete, max: data.total, color: "bg-red-400", textColor: "text-red-700", bg: "bg-red-50" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.textColor}`}>
                      {s.val}
                    </span>
                    <span className="text-xs text-gray-400 w-8 text-right">
                      {s.max > 0 ? Math.round((s.val / s.max) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${s.color} transition-all duration-700`}
                    style={{ width: `${s.max > 0 ? (s.val / s.max) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mini donut chart – Recharts */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-3">Distribución proporcional</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Publicados", value: data.published || 0 },
                      { name: "En Revisión", value: data.inReview || 0 },
                      { name: "Borradores", value: data.draft || 0 },
                      { name: "Obsoletos", value: data.obsolete || 0 },
                    ].filter(d => d.value > 0)}
                    cx="50%" cy="50%"
                    innerRadius={35} outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {["#10b981", "#f59e0b", "#9ca3af", "#f87171"].map((color, i) => (
                      <Cell key={i} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} docs`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1">
                {[
                  { label: "Publicados", val: data.published, color: "bg-emerald-500" },
                  { label: "En Revisión", val: data.inReview, color: "bg-amber-400" },
                  { label: "Borradores", val: data.draft, color: "bg-gray-400" },
                  { label: "Obsoletos", val: data.obsolete, color: "bg-red-400" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-[11px] text-gray-600">{s.label}</span>
                    <span className="text-[11px] font-bold text-gray-800 ml-auto">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Documentos por área – 1/3 width */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Por área</h2>
          <p className="text-xs text-gray-500 mb-4">Distribución de documentos</p>
          {data.byArea.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos de área</p>
          ) : (
            <ResponsiveContainer width="100%" height={data.byArea.length * 40 + 20}>
              <BarChart
                layout="vertical"
                data={data.byArea}
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                />
                <Tooltip
                  cursor={{ fill: "#f0f4ff" }}
                  formatter={(v: any) => [`${v} docs`, ""]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {data.byArea.map((_, i) => (
                    <Cell
                      key={i}
                      fill={`hsl(${220 + i * 25}, 70%, ${60 - i * 4}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Actividad reciente – 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Actividad reciente</h2>
            <Link to="/audit" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Ver auditoría →
            </Link>
          </div>
          {data.auditLogs.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">Sin actividad registrada</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.auditLogs.map((log: any, i: number) => (
                <div key={log.id ?? i} className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="mt-0.5 flex-shrink-0 h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center">
                    <span className="text-xs">{actionIcon(log.action)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium truncate">
                      {log.document?.title ?? log.entityId ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {actionLabel(log.action)}{" "}
                      <span className="text-gray-700 font-medium">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistema"}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                    {log.createdAt
                      ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: es })
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones rápidas – 1/3 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Acciones rápidas</h2>
          <div className="space-y-3">
            {[
              { to: "/documents/create", label: "Crear documento", sub: "Nuevo borrador", icon: "➕", border: "border-blue-200 hover:border-blue-400" },
              { to: "/documents?status=IN_REVIEW", label: "Revisar documentos", sub: `${data.inReview} pendiente${data.inReview !== 1 ? "s" : ""}`, icon: "🔍", border: "border-amber-200 hover:border-amber-400" },
              { to: "/notifications", label: "Notificaciones", sub: `${data.unreadNotifications} sin leer`, icon: "🔔", border: "border-purple-200 hover:border-purple-400" },
              { to: "/flujo-iso", label: "Flujo ISO 22000", sub: "Ver norma y estados", icon: "📋", border: "border-gray-200 hover:border-gray-400" },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 ${a.border} transition-colors`}
              >
                <span className="text-xl shrink-0">{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{a.label}</p>
                  <p className="text-xs text-gray-500">{a.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function GradientCard({ children, gradient }: { children: React.ReactNode; gradient: string }) {
  return (
    <div
      className="group relative flex flex-col rounded-xl bg-white p-6 transition-all duration-300 hover:-translate-y-1"
      style={{
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.07), 0 1px 6px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 12px 40px rgba(0,0,0,0.11), 0 2px 10px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 24px rgba(0,0,0,0.07), 0 1px 6px rgba(0,0,0,0.04)";
      }}
    >
      {/* Colored top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-gradient-to-r ${gradient}`} />
      <div className="relative flex flex-col flex-1 pt-1">{children}</div>
    </div>
  );
}

function IconBox({ children, gradient }: { children: React.ReactNode; gradient: string }) {
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}>
      {children}
    </div>
  );
}

function LiveBadge({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 border border-gray-200">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    CREATE: "Creado por",
    UPDATE: "Actualizado por",
    SUBMIT_REVIEW: "Enviado a revisión por",
    APPROVE: "Aprobado por",
    REJECT: "Cambios solicitados por",
    PUBLISH: "Publicado por",
    ARCHIVE: "Archivado por",
    DELETE: "Eliminado por",
    LOGIN: "Inicio de sesión",
    NEW_VERSION: "Nueva versión creada por",
  };
  return labels[action] ?? action;
}

function actionIcon(action: string): string {
  const icons: Record<string, string> = {
    CREATE: "📄",
    UPDATE: "✏️",
    SUBMIT_REVIEW: "📤",
    APPROVE: "✅",
    REJECT: "🔄",
    PUBLISH: "🚀",
    ARCHIVE: "📦",
    DELETE: "🗑️",
    LOGIN: "🔑",
    NEW_VERSION: "🔢",
  };
  return icons[action] ?? "📌";
}
