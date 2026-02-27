import React from "react";

interface StepProps {
  label: string;
  status: string;
  color: string;
  who: string;
  description: string;
  isActive?: boolean;
  isCurrent?: boolean;
}

function Step({ label, status, color, who, description, isCurrent }: StepProps) {
  return (
    <div
      className={`relative flex flex-col items-center text-center ${isCurrent ? "scale-105" : ""}`}
      style={{ minWidth: 120, maxWidth: 150 }}
    >
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-md mb-2 border-4 ${
          isCurrent ? "border-blue-500 ring-4 ring-blue-200" : "border-transparent"
        }`}
        style={{ backgroundColor: color }}
      >
        {statusIcon(status)}
      </div>
      <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">{label}</span>
      <span className="text-xs text-gray-500 mt-0.5 italic">{who}</span>
      <span className="text-xs text-gray-600 mt-1 leading-tight">{description}</span>
      {isCurrent && (
        <span className="mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
          Estado actual
        </span>
      )}
    </div>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center mx-1 mt-4">
      <div className="text-xs text-gray-400 mb-1 whitespace-nowrap">{label}</div>
      <div className="text-gray-400 text-xl">→</div>
    </div>
  );
}

function statusIcon(status: string) {
  const icons: Record<string, string> = {
    DRAFT: "✏️",
    IN_REVIEW: "🔍",
    CHANGES_REQUESTED: "↩",
    PUBLISHED: "✅",
    OBSOLETE: "📦",
  };
  return icons[status] || "?";
}

const STEPS: StepProps[] = [
  {
    label: "Borrador",
    status: "DRAFT",
    color: "#6B7280",
    who: "Propietario",
    description: "Redacción y carga del archivo del documento.",
    isActive: true,
  },
  {
    label: "En Revisión",
    status: "IN_REVIEW",
    color: "#D97706",
    who: "Revisor / Aprobador",
    description: "Uno o más revisores evalúan el contenido.",
    isActive: true,
  },
  {
    label: "Publicado",
    status: "PUBLISHED",
    color: "#059669",
    who: "Aprobador",
    description: "Documento vigente. Notifica a los lectores del área.",
    isActive: true,
  },
  {
    label: "Obsoleto",
    status: "OBSOLETE",
    color: "#9CA3AF",
    who: "Sistema",
    description: "Versión anterior, reemplazada por nueva versión.",
    isActive: true,
  },
];

interface Props {
  currentStatus?: string;
}

export function DocumentFlowDiagram({ currentStatus }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Flujo de Control Documental</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">ISO 22000 §7.5</span>
      </div>

      <p className="text-xs text-gray-500">
        Conforme a la norma ISO 22000:2018 cláusula 7.5 — Información documentada, los documentos
        deben crearse, actualizarse y controlarse mediante un proceso formal de revisión y aprobación.
      </p>

      {/* Main flow */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-start gap-0 min-w-max mx-auto justify-center flex-wrap gap-y-4">
          {/* DRAFT */}
          <Step {...STEPS[0]} isCurrent={currentStatus === "DRAFT"} />
          <Arrow label="Enviar a Revisión" />

          {/* IN_REVIEW block with branch */}
          <div className="flex flex-col items-center gap-1">
            <Step {...STEPS[1]} isCurrent={currentStatus === "IN_REVIEW"} />
            {/* Branch: approve or request changes */}
            <div className="flex gap-4 mt-1">
              <div className="text-center">
                <div className="text-xs text-green-600 font-medium">✓ Aprueba</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-red-500 font-medium">↩ Solicita cambios</div>
                <div className="text-xs text-gray-400">→ vuelve a Borrador</div>
              </div>
            </div>
          </div>

          <Arrow label="Publicar" />

          {/* PUBLISHED */}
          <Step {...STEPS[2]} isCurrent={currentStatus === "PUBLISHED"} />
          <Arrow label="Nueva versión" />

          {/* OBSOLETE */}
          <Step {...STEPS[3]} isCurrent={currentStatus === "OBSOLETE"} />
        </div>
      </div>

      {/* Nueva versión loop note */}
      <div className="border-t pt-3 text-xs text-gray-500 bg-blue-50 rounded p-3">
        <strong className="text-blue-800">🔄 Revisión periódica (ISO 22000 §7.5.3b):</strong> Cuando un documento publicado requiere
        actualización, se crea una nueva versión — el documento vuelve a Borrador, la versión anterior
        pasa a Obsoleta y se conserva en el historial. Cada versión nueva debe recorrer el ciclo
        completo de revisión y aprobación.
      </div>

      {/* Status legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t pt-3">
        {[
          { label: "Borrador", color: "#6B7280", desc: "Solo visible al propietario" },
          { label: "En Revisión", color: "#D97706", desc: "Los revisores tienen acceso" },
          { label: "Publicado", color: "#059669", desc: "Visible a todos en el área" },
          { label: "Obsoleto", color: "#9CA3AF", desc: "Solo consulta histórica" },
        ].map((s) => (
          <div key={s.label} className="flex items-start gap-2">
            <div className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: s.color }} />
            <div>
              <div className="text-xs font-semibold text-gray-800">{s.label}</div>
              <div className="text-xs text-gray-500">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
