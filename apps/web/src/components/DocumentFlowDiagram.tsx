import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type StepState = "completed" | "active" | "pending";

const STATUS_ORDER = ["DRAFT", "IN_REVIEW", "PUBLISHED", "OBSOLETE"];

function getStepState(stepStatus: string, currentStatus: string): StepState {
  const stepIdx = STATUS_ORDER.indexOf(stepStatus);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

function fmtDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  try {
    return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: es });
  } catch {
    return null;
  }
}

interface StepData {
  status: string;
  title: string;
  subtitle: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface StepProps {
  label: string;
  status: string;
  color: string;
  who: string;
  description: string;
  isActive?: boolean;
  isCurrent?: boolean;
}

const STEPS: StepData[] = [
  {
    status: "DRAFT",
    title: "Borrador",
    subtitle: "El propietario redacta y carga el archivo del documento",
  },
  {
    status: "IN_REVIEW",
    title: "En Revisión",
    subtitle: "Revisores y aprobadores analizan el contenido",
  },
  {
    status: "PUBLISHED",
    title: "Publicado",
    subtitle: "Documento vigente — visible y notificado a los lectores del área",
  },
  {
    status: "OBSOLETE",
    title: "Obsoleto",
    subtitle: "Reemplazado por una versión más reciente, conservado como historial",
  },
];

const STATE_BADGE: Record<StepState, string> = {
  completed: "bg-green-100 text-green-700",
  active: "bg-blue-100 text-blue-700",
  pending: "bg-slate-100 text-slate-500",
};

const STATE_LABEL: Record<StepState, string> = {
  completed: "Completado",
  active: "En curso",
  pending: "Pendiente",
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z" />
    </svg>
  );
}

interface Props {
  currentStatus?: string;
  doc?: any;
}

export function DocumentFlowDiagram({ currentStatus = "DRAFT", doc }: Props) {
  // Map each step to a relevant date from the document
  const dateFor: Record<string, string | undefined> = {
    DRAFT: doc?.createdAt,
    IN_REVIEW: currentStatus === "IN_REVIEW" || STATUS_ORDER.indexOf(currentStatus) > STATUS_ORDER.indexOf("IN_REVIEW")
      ? doc?.updatedAt
      : undefined,
    PUBLISHED: doc?.publishedAt,
    OBSOLETE: currentStatus === "OBSOLETE" ? doc?.updatedAt : undefined,
  };

  const visibleSteps = currentStatus === "OBSOLETE" ? STEPS : STEPS.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-gray-900 text-base">Estado del documento</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">ISO 22000 §7.5</span>
      </div>

      <div className="space-y-0">
        {visibleSteps.map((step, idx) => {
          const state = getStepState(step.status, currentStatus);
          const isLast = idx === visibleSteps.length - 1;
          const dateStr = fmtDate(dateFor[step.status]);

          return (
            <div key={step.status} className="flex gap-4">
              {/* Circle + connector line */}
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 font-semibold text-sm transition-all",
                    state === "completed" ? "bg-slate-900 text-white" : "",
                    state === "active" ? "border-2 border-slate-900 text-slate-900 bg-white ring-4 ring-blue-100" : "",
                    state === "pending" ? "border-2 border-slate-200 text-slate-400 bg-white" : "",
                  ].join(" ")}
                >
                  {state === "completed" ? <CheckIcon /> : <span>{idx + 1}</span>}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 my-1 min-h-8 ${
                      state === "completed" ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>

              {/* Text content */}
              <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-semibold text-sm ${
                      state === "pending" ? "text-slate-400" : "text-slate-900"
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATE_BADGE[state]}`}>
                    {STATE_LABEL[state]}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${state === "pending" ? "text-slate-400" : "text-slate-500"}`}>
                  {step.subtitle}
                </p>
                {dateStr ? (
                  <p className="text-xs text-slate-400 mt-1">{dateStr}</p>
                ) : state === "active" ? (
                  <p className="text-xs text-blue-400 mt-1">En este estado ahora</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t pt-3 mt-4 text-xs text-slate-400">
        Conforme ISO 22000:2018 §7.5 — Información documentada.{" "}
        <span className="text-blue-500">
          Al publicar una nueva versión el documento vuelve a Borrador y la versión anterior queda como Obsoleta.
        </span>
      </div>
    </div>
  );
}
