import React from "react";

/* ────────────────────────────────────────────────────────────
   Colour palette per state
──────────────────────────────────────────────────────────── */
type StepColor = { bg: string; light: string; border: string };

const STATE_COLORS: Record<string, StepColor> = {
  DRAFT:     { bg: "#6B7280", light: "#F3F4F6", border: "#D1D5DB" },
  IN_REVIEW: { bg: "#D97706", light: "#FFFBEB", border: "#FDE68A" },
  PUBLISHED: { bg: "#059669", light: "#ECFDF5", border: "#A7F3D0" },
  OBSOLETE:  { bg: "#9CA3AF", light: "#F9FAFB", border: "#E5E7EB" },
};

/* ────────────────────────────────────────────────────────────
   StepCard — wider, badge integrated, clean proportions
──────────────────────────────────────────────────────────── */
function StepCard({
  num, icon, label, who, description, color,
}: {
  num: number; icon: string; label: string; who: string; description: string; color: StepColor;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-center gap-3 rounded-2xl p-5 border-2 bg-white cursor-default transition-all duration-300 ease-in-out"
      style={{
        width: 160,
        minWidth: 160,
        borderColor: hovered ? color.bg : "#E5E7EB",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 16px 32px ${color.bg}28, 0 2px 8px rgba(0,0,0,0.07)`
          : "0 2px 10px rgba(0,0,0,0.07)",
      }}
    >
      {/* Step badge — top-left corner, inside card */}
      <span
        className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow-md ring-2 ring-white"
        style={{ backgroundColor: color.bg }}
      >
        {num}
      </span>

      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all duration-300 mt-1"
        style={{
          backgroundColor: hovered ? `${color.bg}18` : color.light,
          borderColor: hovered ? `${color.bg}70` : color.border,
        }}
      >
        {icon}
      </div>

      {/* Label + who */}
      <div className="text-center">
        <p
          className="font-extrabold text-xs uppercase tracking-widest transition-colors duration-300"
          style={{ color: hovered ? color.bg : "#1F2937" }}
        >
          {label}
        </p>
        <p
          className="text-xs mt-0.5 font-semibold transition-colors duration-300"
          style={{ color: hovered ? color.bg : "#6B7280" }}
        >
          {who}
        </p>
      </div>

      {/* Description */}
      <p className="text-xs text-center leading-relaxed text-gray-400">{description}</p>

      {/* Bottom accent */}
      <div
        className="h-0.5 rounded-full mx-auto transition-all duration-300"
        style={{ backgroundColor: color.bg, width: hovered ? "100%" : "0%" }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   ConnectorArrow — animated flowing arrow between cards
──────────────────────────────────────────────────────────── */
function ConnectorArrow({
  label, sublabel, color,
}: {
  label: string; sublabel?: string; color: string;
}) {
  const uid = React.useId().replace(/:/g, "");
  return (
    <div
      className="flex flex-col items-center justify-center shrink-0 gap-1"
      style={{ width: 88 }}
    >
      <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap leading-tight text-center">
        {label}
      </span>
      {sublabel && (
        <span className="text-[10px] text-gray-400 whitespace-nowrap text-center">
          {sublabel}
        </span>
      )}
      <svg width="88" height="24" viewBox="0 0 88 24" fill="none">
        <defs>
          <linearGradient id={`lg-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Track */}
        <line x1="0" y1="12" x2="72" y2="12" stroke={`${color}30`} strokeWidth="3" />
        {/* Animated dashes */}
        <line
          x1="0" y1="12" x2="72" y2="12"
          stroke={`url(#lg-${uid})`}
          strokeWidth="3"
          strokeDasharray="8 5"
          style={{ animation: "isoFlowFwd 0.55s linear infinite" }}
        />
        {/* Arrowhead */}
        <polygon points="68,6 88,12 68,18" fill={color} />
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   BackArc — animated 3-sided return path with real arrowhead
──────────────────────────────────────────────────────────── */
function BackArc({
  color, arrowColor, children, maxWidth,
}: {
  color: string; arrowColor: string; children: React.ReactNode; maxWidth?: string | number;
}) {
  return (
    <div
      className="relative flex items-center gap-2 py-2.5 px-5 rounded-lg"
      style={{ maxWidth, minHeight: 40 }}
    >
      {/* Animated dashed border (3 sides: right + bottom + left) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 1 1"
        style={{ overflow: "visible" }}
      >
        <path
          d="M 1,0 L 1,1 L 0,1 L 0,0"
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="9 5"
          style={{ animation: "isoFlowFwd 1s linear infinite" }}
        />
      </svg>
      {/* Left arrowhead pointing right→ to show return to start */}
      <svg width="14" height="12" viewBox="0 0 14 12" fill="none" className="shrink-0 relative z-10">
        <polygon points="8,0 0,6 8,12" fill={arrowColor} />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   DecisionFork — approve / request-changes
──────────────────────────────────────────────────────────── */
function DecisionFork() {
  return (
    <div className="flex justify-center gap-3 mt-4">
      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 shadow-sm">
        <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <div className="text-xs font-bold text-emerald-700">Aprueba</div>
          <div className="text-[10px] text-emerald-600">→ Publicar</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-red-50 border border-red-300 rounded-xl px-3 py-2 shadow-sm">
        <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
        <div>
          <div className="text-xs font-bold text-red-600">Solicita cambios</div>
          <div className="text-[10px] text-red-500">← vuelve a Borrador</div>
        </div>
      </div>
    </div>
  );
}

const ROLES = [
  { role: "Propietario de Documentos", desc: "Crea, redacta y sube los archivos. Envía a revisión cuando está listo.", color: "#3B82F6", icon: "✍️" },
  { role: "Revisor", desc: "Analiza el documento, puede solicitar cambios o recomendar aprobación.", color: "#8B5CF6", icon: "🔍" },
  { role: "Aprobador", desc: "Aprueba formalmente y habilita la publicación del documento.", color: "#10B981", icon: "✅" },
  { role: "Administrador / Calidad", desc: "Gestiona el sistema, aprueba usuarios y supervisa el proceso.", color: "#F59E0B", icon: "⚙️" },
  { role: "Lector", desc: "Accede a los documentos publicados de su área para consulta.", color: "#6B7280", icon: "👁️" },
];

const CLAUSES = [
  { num: "§7.5.1", title: "Generalidades", text: "La organización debe incluir la información documentada requerida por la norma y la determinada como necesaria para la eficacia del SGIA." },
  { num: "§7.5.2", title: "Creación y actualización", text: "Al crear/actualizar información documentada, se debe garantizar identificación, formato adecuado, revisión y aprobación formal para la idoneidad y adecuación." },
  { num: "§7.5.3", title: "Control de la información documentada", text: "La información debe estar disponible donde se necesite, protegida adecuadamente. Se controla distribución, acceso, uso, almacenamiento y disposición. Los documentos obsoletos se conservan identificados para prevenir uso no intencionado." },
];

export function ISOFlowPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Keyframe for animated flow — single animation, direction determined by path drawing order */}
      <style>{`
        @keyframes isoFlowFwd {
          from { stroke-dashoffset: 16; }
          to   { stroke-dashoffset: 0;  }
        }
      `}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📋</span>
              <h1 className="text-2xl font-bold">Flujo de Control Documental</h1>
            </div>
            <p className="text-blue-100 text-sm max-w-xl leading-relaxed">
              El sistema sigue el ciclo de vida establecido por la norma{" "}
              <strong className="text-white">ISO 22000:2018</strong>, Cláusula 7.5 — Información documentada.
              Cada documento es creado, revisado, aprobado, publicado y eventualmente reemplazado
              siguiendo este proceso formal.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 text-center shrink-0 border border-white/20">
            <div className="text-3xl font-black tracking-tight">ISO 22000</div>
            <div className="text-xs text-blue-200 mt-0.5">§7.5 Información documentada</div>
            <div className="text-xs text-blue-300 mt-1">Edición 2018</div>
          </div>
        </div>
      </div>

      {/* Main flow diagram */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-1 text-lg flex items-center gap-2">
          <span className="text-blue-600">⟳</span> Diagrama de flujo del proceso
        </h2>
        <p className="text-xs text-gray-400 mb-8">
          Ciclo completo de vida de un documento — cada nueva versión reinicia el proceso desde el paso 1
        </p>

        <div className="overflow-x-auto pb-4">
          {/* Horizontal flow — items-center so arrows align with card midpoints */}
          <div className="flex items-center justify-center gap-0 min-w-max mx-auto pt-6">
            <StepCard num={1} icon="✏️" label="Borrador" who="Propietario"
              description="Se redacta el documento y se carga el archivo."
              color={STATE_COLORS.DRAFT}
            />
            <ConnectorArrow label="Enviar a" sublabel="revisión" color={STATE_COLORS.DRAFT.bg} />

            {/* IN_REVIEW with decision fork below — wrapped so fork doesn't affect arrow alignment */}
            <div className="flex flex-col items-center">
              <StepCard num={2} icon="🔍" label="En Revisión" who="Revisor / Aprobador"
                description="Uno o más revisores evalúan el contenido y la conformidad."
                color={STATE_COLORS.IN_REVIEW}
              />
              <DecisionFork />
            </div>

            <ConnectorArrow label="Publicar" color={STATE_COLORS.IN_REVIEW.bg} />

            <StepCard num={3} icon="✅" label="Publicado" who="Todos (lectura)"
              description="Documento vigente. Se notifica a los lectores del área."
              color={STATE_COLORS.PUBLISHED}
            />
            <ConnectorArrow label="Nueva" sublabel="versión" color={STATE_COLORS.PUBLISHED.bg} />

            <StepCard num={4} icon="📦" label="Obsoleto" who="Sistema"
              description="Versión anterior conservada en historial. Reemplazada por la nueva."
              color={STATE_COLORS.OBSOLETE}
            />
          </div>

          {/* Return arcs */}
          <div className="min-w-max mx-auto mt-10 space-y-3">
            {/* Short arc: EN REVISIÓN → BORRADOR */}
            <BackArc
              color="#FCA5A5"
              arrowColor="#F87171"
              maxWidth={`calc(160px + 88px + 160px + 24px)`}
            >
              <span className="text-xs text-red-400 italic font-medium">
                Si el revisor <strong className="not-italic font-bold text-red-500">solicita cambios</strong>,
                el documento regresa a Borrador para correcciones
              </span>
            </BackArc>

            {/* Long arc: PUBLICADO → BORRADOR (ciclo completo) */}
            <BackArc
              color="#6EE7B7"
              arrowColor="#059669"
            >
              <span className="text-xs text-emerald-600 italic font-medium">
                Al crear una <strong className="not-italic font-bold">nueva versión</strong>,
                el doc publicado pasa a Obsoleto y se inicia un nuevo Borrador → ciclo completo
              </span>
            </BackArc>
          </div>
        </div>
      </div>

      {/* Versioning note */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h2 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-base">
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">§7.5.3b</span>
          Revisión periódica y versionado
        </h2>
        <p className="text-sm text-blue-800 leading-relaxed mb-4">
          Cuando un documento ya publicado requiere actualización, se crea una <strong>nueva versión</strong>.
          El proceso completo reinicia desde el paso 1:
        </p>
        <div className="flex flex-wrap gap-2 items-center text-xs">
          {[
            { label: "v1.0  PUBLICADO", cls: "bg-green-100 text-green-700 border-green-300 border" },
            { label: "→", cls: "text-gray-400 font-bold text-base" },
            { label: "v1.0  OBSOLETO", cls: "bg-gray-100 text-gray-600 border-gray-300 border" },
            { label: "+", cls: "text-gray-400 font-bold text-base" },
            { label: "v2.0  BORRADOR", cls: "bg-yellow-100 text-yellow-700 border-yellow-300 border" },
            { label: "→", cls: "text-gray-400 font-bold text-base" },
            { label: "Revisión y aprobación", cls: "bg-orange-100 text-orange-700 border-orange-300 border" },
            { label: "→", cls: "text-gray-400 font-bold text-base" },
            { label: "v2.0  PUBLICADO", cls: "bg-green-100 text-green-700 border-green-300 border" },
          ].map((item, i) =>
            item.cls.includes("text-gray-400") ? (
              <span key={i} className={item.cls}>{item.label}</span>
            ) : (
              <span key={i} className={`px-2.5 py-1 rounded-full font-medium ${item.cls}`}>{item.label}</span>
            )
          )}
        </div>
        <p className="text-xs text-blue-600 mt-4 italic border-t border-blue-200 pt-3">
          Las versiones obsoletas quedan conservadas en el historial y son accesibles para consulta,
          pero no se usan operativamente — conforme a ISO 22000 §7.5.3 sobre protección de la información documentada.
        </p>
      </div>

      {/* Roles */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-4 text-base flex items-center gap-2">
          👥 Roles del sistema
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ROLES.map((r) => (
            <div
              key={r.role}
              className="flex gap-3 p-3.5 rounded-xl border hover:border-blue-200 bg-gray-50 hover:bg-blue-50/40 transition-all"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 shadow"
                style={{ background: `${r.color}22`, border: `1.5px solid ${r.color}55` }}
              >
                {r.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">{r.role}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-snug">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ISO Clauses */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-4 text-base flex items-center gap-2">
          📖 Cláusulas ISO 22000:2018 aplicadas
        </h2>
        <div className="space-y-3">
          {CLAUSES.map((c) => (
            <div key={c.num} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-200 transition">
              <div className="shrink-0">
                <span className="inline-block bg-blue-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                  {c.num}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-800 mb-1">{c.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
          <strong>🔎 Nota de implementación:</strong> Este sistema implementa los controles requeridos por la norma:
          identificación de documentos (código y versión), historial de revisiones con fechas y responsables,
          aprobación formal antes de publicación, conservación de versiones obsoletas identificadas
          y notificación automática a los lectores cuando hay documentos nuevos en su área.
        </div>
      </div>

    </div>
  );
}
