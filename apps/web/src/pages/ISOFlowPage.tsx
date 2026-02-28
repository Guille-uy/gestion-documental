import React from "react";

type StepColor = { bg: string; text: string; border: string; glow: string };

const STATE_COLORS: Record<string, StepColor> = {
  DRAFT:     { bg: "#6B7280", text: "white", border: "#4B5563", glow: "#6B728033" },
  IN_REVIEW: { bg: "#D97706", text: "white", border: "#B45309", glow: "#D9770633" },
  PUBLISHED: { bg: "#059669", text: "white", border: "#047857", glow: "#05966933" },
  OBSOLETE:  { bg: "#9CA3AF", text: "white", border: "#6B7280", glow: "#9CA3AF33" },
};

function StepCard({
  num, icon, label, who, description, color,
}: {
  num: number; icon: string; label: string; who: string; description: string; color: StepColor;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div className="flex flex-col items-center" style={{ minWidth: 144 }}>
      {/* Step number badge */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mb-2 shadow z-10"
        style={{ backgroundColor: color.border }}
      >
        {num}
      </div>

      {/* Light card — consistent with app theme, hover lifts + reveals color accent */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex flex-col gap-3 w-36 rounded-2xl p-4 border-2 bg-white cursor-default transition-all duration-300 ease-in-out"
        style={{
          borderColor: hovered ? color.bg : "#E5E7EB",
          transform: hovered ? "translateY(-6px)" : "translateY(0)",
          boxShadow: hovered
            ? `0 16px 32px ${color.bg}30, 0 2px 8px rgba(0,0,0,0.06)`
            : "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* Icon area */}
        <div className="relative">
          <div
            className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl border-2 transition-all duration-300"
            style={{
              backgroundColor: hovered ? `${color.bg}18` : "#F9FAFB",
              borderColor: hovered ? `${color.bg}60` : "#E5E7EB",
            }}
          >
            {icon}
          </div>
          {/* Status dot: gray at rest → state color on hover */}
          <div
            className="absolute top-0 right-4 w-2.5 h-2.5 rounded-full border-2 border-white shadow transition-all duration-300"
            style={{ backgroundColor: hovered ? color.bg : "#D1D5DB" }}
          />
        </div>

        {/* Label + who — always fully readable */}
        <div className="text-center">
          <p
            className="font-bold text-xs uppercase tracking-widest transition-colors duration-300"
            style={{ color: hovered ? color.bg : "#374151" }}
          >
            {label}
          </p>
          <p
            className="text-xs mt-1 font-medium transition-colors duration-300"
            style={{ color: hovered ? color.bg : "#6B7280", opacity: 0.85 }}
          >
            {who}
          </p>
        </div>

        {/* Description — always fully readable */}
        <p className="text-xs text-center leading-tight text-gray-500">
          {description}
        </p>

        {/* Bottom accent line — expands on hover */}
        <div
          className="h-0.5 rounded-full mx-auto transition-all duration-300"
          style={{
            backgroundColor: color.bg,
            width: hovered ? "100%" : "0%",
          }}
        />
      </div>
    </div>
  );
}

function ForwardArrow({ label, sublabel, color }: { label: string; sublabel?: string; color: string }) {
  const id = `grad-${label.replace(/\s/g, "")}`;
  return (
    <div className="flex flex-col items-center justify-center px-1 pt-6 shrink-0" style={{ minWidth: 68 }}>
      <span className="text-xs font-semibold text-gray-500 mb-0.5 whitespace-nowrap text-center leading-tight">{label}</span>
      {sublabel && <span className="text-xs text-gray-400 mb-1 whitespace-nowrap text-center">{sublabel}</span>}
      <svg width="52" height="18" viewBox="0 0 52 18" fill="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <line x1="0" y1="9" x2="44" y2="9" stroke={`url(#${id})`} strokeWidth="2.5" />
        <polygon points="38,5 52,9 38,13" fill={color} />
      </svg>
    </div>
  );
}

function DecisionFork() {
  return (
    <div className="flex justify-center gap-4 mt-3 px-2">
      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-lg px-3 py-1.5">
        <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <div className="text-xs font-bold text-emerald-700">Aprueba</div>
          <div className="text-xs text-emerald-600">→ Publicar</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-red-50 border border-red-300 rounded-lg px-3 py-1.5">
        <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
        <div>
          <div className="text-xs font-bold text-red-600">Solicita cambios</div>
          <div className="text-xs text-red-500">← vuelve a Borrador</div>
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
          {/* Horizontal flow */}
          <div className="flex items-start justify-center gap-0 min-w-max mx-auto">
            <StepCard num={1} icon="✏️" label="Borrador" who="Propietario"
              description="Se redacta el documento y se carga el archivo."
              color={STATE_COLORS.DRAFT}
            />
            <ForwardArrow label="Enviar a" sublabel="revisión" color={STATE_COLORS.DRAFT.bg} />

            {/* IN_REVIEW with decision fork below */}
            <div className="flex flex-col items-center">
              <StepCard num={2} icon="🔍" label="En Revisión" who="Revisor / Aprobador"
                description="Uno o más revisores evalúan el contenido y la conformidad."
                color={STATE_COLORS.IN_REVIEW}
              />
              <DecisionFork />
            </div>

            <ForwardArrow label="Publicar" color={STATE_COLORS.IN_REVIEW.bg} />

            <StepCard num={3} icon="✅" label="Publicado" who="Todos (lectura)"
              description="Documento vigente. Se notifica a los lectores del área."
              color={STATE_COLORS.PUBLISHED}
            />
            <ForwardArrow label="Nueva" sublabel="versión" color={STATE_COLORS.PUBLISHED.bg} />

            <StepCard num={4} icon="📦" label="Obsoleto" who="Sistema"
              description="Versión anterior conservada en historial. Reemplazada por la nueva."
              color={STATE_COLORS.OBSOLETE}
            />
          </div>

          {/* Back-arc labels */}
          <div className="min-w-max mx-auto mt-8 space-y-2">
            {/* Cambios requested → back to DRAFT */}
            <div
              className="border-2 border-dashed rounded-b-xl flex items-center justify-center py-2 px-4 gap-2"
              style={{ borderColor: "#FCA5A5", borderTop: "none", maxWidth: "calc(148px + 68px + 148px + 40px)" }}
            >
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <polygon points="10,1 0,6 10,11" fill="#F87171" />
              </svg>
              <span className="text-xs text-red-400 italic font-medium">
                Si el revisor <strong className="not-italic font-bold">solicita cambios</strong>, el documento regresa a Borrador para correcciones
              </span>
            </div>

            {/* New version loop */}
            <div
              className="border-2 border-dashed rounded-b-xl flex items-center justify-center py-2 px-4 gap-2"
              style={{ borderColor: "#6EE7B7", borderTop: "none" }}
            >
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <polygon points="10,1 0,6 10,11" fill="#059669" />
              </svg>
              <span className="text-xs text-emerald-600 italic font-medium">
                Al crear una <strong className="not-italic font-bold">nueva versión</strong>, el doc publicado pasa a Obsoleto y se inicia un nuevo Borrador → ciclo completo
              </span>
            </div>
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
