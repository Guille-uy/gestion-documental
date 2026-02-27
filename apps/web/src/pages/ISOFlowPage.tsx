import React from "react";

type StepColor = { bg: string; text: string; border: string; line: string };

const STATE_COLORS: Record<string, StepColor> = {
  DRAFT:      { bg: "#6B7280", text: "white", border: "#4B5563", line: "#6B7280" },
  IN_REVIEW:  { bg: "#D97706", text: "white", border: "#B45309", line: "#D97706" },
  PUBLISHED:  { bg: "#059669", text: "white", border: "#047857", line: "#059669" },
  OBSOLETE:   { bg: "#9CA3AF", text: "white", border: "#6B7280", line: "#9CA3AF" },
};

function FlowStep({
  emoji, label, description, who, color, isCurrent = false,
}: {
  emoji: string; label: string; description: string; who: string;
  color: StepColor; isCurrent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all ${
        isCurrent ? "shadow-lg scale-105" : "shadow"
      }`}
      style={{
        borderColor: isCurrent ? color.border : "#E5E7EB",
        minWidth: 130, maxWidth: 160,
        outline: isCurrent ? `4px solid ${color.bg}33` : undefined,
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3 shadow-md"
        style={{ backgroundColor: color.bg }}
      >
        {emoji}
      </div>
      <span className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-1">{label}</span>
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full mb-2"
        style={{ backgroundColor: `${color.bg}20`, color: color.bg }}
      >
        {who}
      </span>
      <span className="text-xs text-gray-600 leading-tight">{description}</span>
    </div>
  );
}

function Arrow({ label, color = "#9CA3AF" }: { label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center mx-1 mt-2 shrink-0">
      <span className="text-xs text-gray-400 mb-1 whitespace-nowrap">{label}</span>
      <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
        <line x1="0" y1="8" x2="26" y2="8" stroke={color} strokeWidth="2" />
        <polygon points="22,4 32,8 22,12" fill={color} />
      </svg>
    </div>
  );
}

function BackArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center mx-2 mt-2 shrink-0">
      <span className="text-xs text-red-400 font-medium mb-1 whitespace-nowrap">{label}</span>
      <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
        <line x1="32" y1="8" x2="6" y2="8" stroke="#F87171" strokeWidth="2" strokeDasharray="4 2" />
        <polygon points="10,4 0,8 10,12" fill="#F87171" />
      </svg>
    </div>
  );
}

const ROLES = [
  { role: "Propietario de Documentos", desc: "Crea, redacta y sube los archivos. Envía a revisión cuando está listo.", color: "#3B82F6" },
  { role: "Revisor", desc: "Analiza el documento, puede solicitar cambios o recomendar aprobación.", color: "#8B5CF6" },
  { role: "Aprobador", desc: "Aprueba formalmente y habilita la publicación del documento.", color: "#10B981" },
  { role: "Administrador / Calidad", desc: "Gestiona el sistema, aprueba usuarios y supervisa el proceso.", color: "#F59E0B" },
  { role: "Lector", desc: "Accede a los documentos publicados de su área para consulta.", color: "#6B7280" },
];

const CLAUSES = [
  { num: "§7.5.1", title: "Generalidades", text: "La organización debe incluir la información documentada requerida por la norma y la determinada como necesaria para la eficacia del SGIA." },
  { num: "§7.5.2", title: "Creación y actualización", text: "Al crear/actualizar información documentada, se debe garantizar identificación, formato adecuado, revisión y aprobación formal para la idoneidad y adecuación." },
  { num: "§7.5.3", title: "Control de la información documentada", text: "La información debe estar disponible donde se necesite, protegida adecuadamente, y se debe controlar su distribución, acceso, uso, almacenamiento, conservación y disposición. Los documentos obsoletos deben identificarse y conservarse para prevenir su uso no intencionado." },
];

export function ISOFlowPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Flujo de Control Documental</h1>
            <p className="text-blue-100 text-sm max-w-xl">
              El sistema sigue el ciclo de vida de documentos establecido por la norma
              <strong className="text-white"> ISO 22000:2018</strong>, Cláusula 7.5 — Información documentada.
              Cada documento debe ser creado, revisado, aprobado, publicado y eventualmente reemplazado
              por una nueva versión siguiendo este proceso formal.
            </p>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2 text-center shrink-0">
            <div className="text-2xl font-bold">ISO 22000</div>
            <div className="text-xs text-blue-200">§7.5 Información documentada</div>
          </div>
        </div>
      </div>

      {/* Main flow diagram */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-bold text-gray-900 mb-6 text-lg">Diagrama de flujo del proceso</h2>
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center justify-center gap-0 min-w-max mx-auto py-4">

            <FlowStep
              emoji="✏️" label="Borrador" who="Propietario"
              description="Se redacta el documento y se carga el archivo."
              color={STATE_COLORS.DRAFT}
            />
            <Arrow label="Enviar a revisión" color={STATE_COLORS.DRAFT.line} />

            {/* IN_REVIEW + branch */}
            <div className="flex flex-col items-center gap-2">
              <FlowStep
                emoji="🔍" label="En Revisión" who="Revisor / Aprobador"
                description="Uno o más revisores evalúan el contenido y la conformidad."
                color={STATE_COLORS.IN_REVIEW}
              />
              <div className="flex items-center gap-8 mt-1">
                <div className="flex flex-col items-center">
                  <div className="text-xs font-semibold text-green-600">✓ Aprueba</div>
                  <div className="text-xs text-gray-400">→ Publicar</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-xs font-semibold text-red-500">↩ Solicita cambios</div>
                  <div className="text-xs text-gray-400">← vuelve a Borrador</div>
                </div>
              </div>
            </div>

            <Arrow label="Publicar" color={STATE_COLORS.IN_REVIEW.line} />

            <FlowStep
              emoji="✅" label="Publicado" who="Todos (lectura)"
              description="Documento vigente. Se notifica a los lectores del área."
              color={STATE_COLORS.PUBLISHED}
            />
            <Arrow label="Nueva versión" color={STATE_COLORS.PUBLISHED.line} />

            <FlowStep
              emoji="📦" label="Obsoleto" who="Sistema"
              description="Versión anterior, conservada como historial. Reemplazada por la nueva."
              color={STATE_COLORS.OBSOLETE}
            />
          </div>

          {/* Return arrow for changes requested */}
          <div className="flex justify-center mt-2">
            <div className="flex items-center gap-2 text-xs text-red-400 italic">
              <BackArrow label="" />
              <span>Si el revisor <strong>solicita cambios</strong>, el documento regresa al estado Borrador para correcciones</span>
            </div>
          </div>
        </div>
      </div>

      {/* Versioning note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          🔄 <span>Revisión periódica y versionado (ISO 22000 §7.5.3b)</span>
        </h2>
        <p className="text-sm text-blue-800 leading-relaxed mb-4">
          Cuando un documento ya publicado requiere actualización, se crea una <strong>nueva versión</strong>.
          El proceso completo reinicia desde cero:
        </p>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          {[
            { label: "v1.0 PUBLICADO", color: "bg-green-100 text-green-700 border-green-300" },
            { label: "→", color: "text-gray-500 font-bold" },
            { label: "v1.0 pasa a OBSOLETO", color: "bg-gray-100 text-gray-600 border-gray-300" },
            { label: "+", color: "text-gray-500 font-bold" },
            { label: "v2.0 nuevo BORRADOR", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
            { label: "→", color: "text-gray-500 font-bold" },
            { label: "Revisión y aprobación completa", color: "bg-orange-100 text-orange-700 border-orange-300" },
            { label: "→", color: "text-gray-500 font-bold" },
            { label: "v2.0 PUBLICADO", color: "bg-green-100 text-green-700 border-green-300" },
          ].map((item, i) => (
            item.label === "→" || item.label === "+" ? (
              <span key={i} className={item.color}>{item.label}</span>
            ) : (
              <span key={i} className={`px-2 py-1 rounded-full border text-xs font-medium ${item.color}`}>{item.label}</span>
            )
          ))}
        </div>
        <p className="text-xs text-blue-700 mt-4 italic">
          Las versiones obsoletas quedan conservadas en el historial del documento y son accesibles para consulta,
          pero no se usan en operaciones activas — conforme a ISO 22000 §7.5.3 sobre protección de la información documentada.
        </p>
      </div>

      {/* Roles */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-bold text-gray-900 mb-4 text-lg">Roles del sistema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <div key={r.role} className="flex gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
              <div
                className="w-3 h-3 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: r.color }}
              />
              <div>
                <div className="text-sm font-semibold text-gray-800">{r.role}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-tight">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ISO Clauses */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-bold text-gray-900 mb-4 text-lg">
          Cláusulas ISO 22000:2018 aplicadas
        </h2>
        <div className="space-y-4">
          {CLAUSES.map((c) => (
            <div key={c.num} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="shrink-0">
                <span className="inline-block bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                  {c.num}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800 mb-1">{c.title}</div>
                <div className="text-xs text-gray-600 leading-relaxed">{c.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
          <strong>Nota:</strong> Este sistema implementa los controles requeridos por la norma: identificación
          de documentos (código y versión), historial de revisiones con fechas y responsables,
          aprobación formal antes de publicación, conservación de versiones obsoletas identificadas,
          y notificación automática a los lectores cuando hay documentos nuevos en su área.
        </div>
      </div>

    </div>
  );
}
