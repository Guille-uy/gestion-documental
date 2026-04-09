import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService } from "../services/api.js";
import { useAuthStore } from "../store/auth.js";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Module definitions
// ─────────────────────────────────────────────────────────────────────────────

const MODULES = [
  { key: "objetivo",        label: "Objetivo",              icon: "🎯", hint: "Defina el propósito principal: ¿qué busca lograr o establecer este documento?" },
  { key: "alcance",         label: "Alcance",               icon: "📐", hint: "Indique a qué áreas, procesos o personas aplica. Incluya exclusiones si corresponde." },
  { key: "responsabilidades", label: "Responsabilidades",   icon: "👥", hint: "Detalle los roles involucrados y las responsabilidades específicas de cada uno." },
  { key: "docsRelacionados", label: "Docs. relacionados",   icon: "🔗", hint: "Liste los documentos del SGI que se consultan o complementan junto a este." },
  { key: "descripcion",     label: "Descripción / Contenido", icon: "📝", hint: "Desarrolle el contenido principal: pasos, criterios, tablas, definiciones." },
  { key: "controlCambios",  label: "Control de cambios",    icon: "📋", hint: "Registre el historial de versiones con cambios, autor, fecha y aprobación." },
] as const;

type ModuleKey = "objetivo" | "alcance" | "responsabilidades" | "docsRelacionados" | "descripcion" | "controlCambios";
type Visibility = "required" | "optional" | "hidden";
type ModuleConfig = Record<ModuleKey, Visibility>;

const DEFAULT_MODULE_CONFIG: Record<string, ModuleConfig> = {
  PO: { objetivo:"required", alcance:"required", responsabilidades:"optional", docsRelacionados:"optional", descripcion:"required", controlCambios:"required" },
  MN: { objetivo:"required", alcance:"required", responsabilidades:"optional", docsRelacionados:"optional", descripcion:"required", controlCambios:"required" },
  DM: { objetivo:"required", alcance:"required", responsabilidades:"optional", docsRelacionados:"optional", descripcion:"required", controlCambios:"required" },
  PR: { objetivo:"required", alcance:"required", responsabilidades:"optional", docsRelacionados:"optional", descripcion:"required", controlCambios:"required" },
  IT: { objetivo:"optional", alcance:"optional", responsabilidades:"optional", docsRelacionados:"optional", descripcion:"required", controlCambios:"required" },
  PT: { objetivo:"required", alcance:"required", responsabilidades:"optional", docsRelacionados:"optional", descripcion:"required", controlCambios:"required" },
  RG: { objetivo:"hidden",   alcance:"hidden",   responsabilidades:"hidden",   docsRelacionados:"hidden",   descripcion:"optional", controlCambios:"hidden" },
  LI: { objetivo:"hidden",   alcance:"hidden",   responsabilidades:"hidden",   docsRelacionados:"hidden",   descripcion:"optional", controlCambios:"hidden" },
  PL: { objetivo:"hidden",   alcance:"hidden",   responsabilidades:"hidden",   docsRelacionados:"hidden",   descripcion:"optional", controlCambios:"hidden" },
  IN: { objetivo:"hidden",   alcance:"hidden",   responsabilidades:"hidden",   docsRelacionados:"hidden",   descripcion:"optional", controlCambios:"hidden" },
  FT: { objetivo:"hidden",   alcance:"hidden",   responsabilidades:"hidden",   docsRelacionados:"hidden",   descripcion:"required", controlCambios:"hidden" },
  DF: { objetivo:"hidden",   alcance:"hidden",   responsabilidades:"hidden",   docsRelacionados:"hidden",   descripcion:"required", controlCambios:"hidden" },
  AR: { objetivo:"hidden",   alcance:"hidden",   responsabilidades:"hidden",   docsRelacionados:"hidden",   descripcion:"required", controlCambios:"hidden" },
  ES: { objetivo:"hidden",   alcance:"hidden",   responsabilidades:"hidden",   docsRelacionados:"hidden",   descripcion:"required", controlCambios:"hidden" },
  CE: { objetivo:"hidden",   alcance:"hidden",   responsabilidades:"hidden",   docsRelacionados:"hidden",   descripcion:"required", controlCambios:"hidden" },
  CI: { objetivo:"hidden",   alcance:"hidden",   responsabilidades:"hidden",   docsRelacionados:"hidden",   descripcion:"required", controlCambios:"hidden" },
  AN: { objetivo:"hidden",   alcance:"hidden",   responsabilidades:"hidden",   docsRelacionados:"hidden",   descripcion:"optional", controlCambios:"required" },
  OG: { objetivo:"hidden",   alcance:"hidden",   responsabilidades:"hidden",   docsRelacionados:"hidden",   descripcion:"optional", controlCambios:"required" },
  CT: { objetivo:"optional", alcance:"hidden",   responsabilidades:"optional", docsRelacionados:"hidden",   descripcion:"optional", controlCambios:"hidden" },
};

const FALLBACK_CONFIG: ModuleConfig = {
  objetivo:"required", alcance:"required", responsabilidades:"optional",
  docsRelacionados:"optional", descripcion:"required", controlCambios:"required",
};

export function CreateDocumentPage() {
  const { draftId } = useParams<{ draftId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isRestricted = !!user && !["ADMIN", "QUALITY_MANAGER"].includes(user.role ?? "") && !!user.area;

  // Catalog data
  const [areas, setAreas] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);

  // Wizard step state
  const [step, setStep] = useState(0);
  const [loadingDraft, setLoadingDraft] = useState(!!draftId);
  const [doc, setDoc] = useState<any>(null);

  // Step 0 form
  const [setup, setSetup] = useState({ title: "", type: "", area: "", siteCode: "", sectorCode: "" });
  const [showTooltip, setShowTooltip] = useState(false);
  const [creating, setCreating] = useState(false);

  // Module state
  const [content, setContent] = useState<Record<string, string>>({});
  const [moduleCfg, setModuleCfg] = useState<ModuleConfig>(FALLBACK_CONFIG);
  const [activeModules, setActiveModules] = useState<Array<{ key: string; label: string; icon: string; hint: string }>>([]);
  const [saving, setSaving] = useState(false);

  // AI assist
  const [ai, setAi] = useState({ show: false, loading: false, suggestion: "" });

  // Textarea auto-resize ref
  const taRef = useRef<HTMLTextAreaElement>(null);

  const [configError, setConfigError] = useState(false);

  const loadCatalog = () => {
    setConfigError(false);
    Promise.all([apiService.getAreas(), apiService.getDocumentTypes()]).then(([aRes, tRes]) => {
      const aList: any[] = aRes.data.data ?? [];
      const tList: any[] = tRes.data.data ?? [];
      setAreas(aList);
      setDocTypes(tList);
      if (!draftId) {
        const defaultType = tList[0]?.code ?? "";
        const defaultArea = isRestricted && user?.area ? user.area : aList[0]?.name ?? "";
        const areaObj = aList.find((a: any) => a.name === defaultArea) ?? aList[0];
        setSetup(s => ({ ...s, type: defaultType, area: defaultArea, siteCode: areaObj?.siteCode ?? "", sectorCode: areaObj?.sectorCode ?? "" }));
      }
    }).catch((err: any) => {
      if (err?.response?.status === 401) {
        navigate("/login");
      } else {
        setConfigError(true);
        toast.error("Error al cargar configuración");
      }
    });
  };

  // ── Load catalog data ──────────────────────────────────────────────────────
  useEffect(() => { loadCatalog(); }, []);

  // ── Load draft ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!draftId) return;
    setLoadingDraft(true);
    apiService.getDocument(draftId).then(res => {
      const d = res.data.data;
      setDoc(d);
      setSetup({ title: d.title, type: d.type, area: d.area, siteCode: d.siteCode ?? "", sectorCode: d.sectorCode ?? "" });
      if (d.content && typeof d.content === "object") setContent(d.content as Record<string, string>);
      setStep(1);
    }).catch(() => {
      toast.error("No se pudo cargar el borrador");
      navigate("/documents/create");
    }).finally(() => setLoadingDraft(false));
  }, [draftId]);

  // ── Recompute active modules when type changes ─────────────────────────────
  useEffect(() => {
    if (!setup.type) return;
    const typeObj = docTypes.find((t: any) => t.code === setup.type);
    const cfg: ModuleConfig = (typeObj?.moduleConfig as ModuleConfig) ?? DEFAULT_MODULE_CONFIG[setup.type] ?? FALLBACK_CONFIG;
    setModuleCfg(cfg);
    setActiveModules(MODULES.filter(m => cfg[m.key as ModuleKey] !== "hidden") as any[]);
  }, [setup.type, docTypes]);

  // ── Auto-resize textarea on step/content change ────────────────────────────
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = taRef.current.scrollHeight + "px";
  }, [step, content]);

  const currentModule = (step >= 1 && step <= activeModules.length) ? activeModules[step - 1] : null;
  const isReviewStep = step === activeModules.length + 1;
  const allSteps = ["Configuración", ...activeModules.map((m: any) => m.label), "Revisión"];

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSetupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "area") {
      const a = areas.find((x: any) => x.name === value);
      setSetup(s => ({ ...s, area: value, siteCode: a?.siteCode ?? "", sectorCode: a?.sectorCode ?? "" }));
    } else {
      setSetup(s => ({ ...s, [name]: value }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setup.title.trim() || !setup.type || !setup.area) {
      toast.error("Completá todos los campos obligatorios"); return;
    }
    setCreating(true);
    try {
      const res = await apiService.createDocument({ title: setup.title.trim(), type: setup.type, area: setup.area, siteCode: setup.siteCode || undefined, sectorCode: setup.sectorCode || undefined });
      const newDoc = res.data.data;
      setDoc(newDoc);
      toast.success(`Documento ${newDoc.code} creado`);
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Error al crear el documento");
    } finally {
      setCreating(false);
    }
  };

  const saveContent = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      await apiService.updateDocumentContent(doc.id, content as Record<string, string>);
    } catch {
      setSaving(false);
      toast.error("Error guardando borrador");
      throw new Error("save failed");
    }
    setSaving(false);
  };

  const handleSaveDraft = async () => {
    try { await saveContent(); toast.success("Borrador guardado"); } catch {}
  };

  const handleNext = async () => {
    const key = currentModule?.key as ModuleKey | undefined;
    if (key && moduleCfg[key] === "required" && !content[key]?.trim()) {
      toast.error("Este módulo es requerido — completá el contenido antes de continuar"); return;
    }
    try {
      await saveContent();
      setAi({ show: false, loading: false, suggestion: "" });
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  };

  const handlePrev = () => {
    setAi({ show: false, loading: false, suggestion: "" });
    setStep(s => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAiAssist = async () => {
    if (!currentModule) return;
    setAi({ show: true, loading: true, suggestion: "" });
    try {
      const res = await apiService.aiAssist({ module: currentModule.key, docType: setup.type, title: setup.title, area: setup.area });
      setAi({ show: true, loading: false, suggestion: res.data.data.suggestion });
    } catch {
      toast.error("Error al generar sugerencia");
      setAi({ show: false, loading: false, suggestion: "" });
    }
  };

  const handleUseSuggestion = () => {
    if (!currentModule) return;
    const cur = content[currentModule.key] ?? "";
    setContent(c => ({ ...c, [currentModule.key]: cur + (cur.trim() ? "\n\n" : "") + ai.suggestion }));
    setAi({ show: false, loading: false, suggestion: "" });
    toast.success("Sugerencia insertada");
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loadingDraft) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Cargando borrador...</p>
        </div>
      </div>
    );
  }

  // ── Progress indicator ─────────────────────────────────────────────────────
  const renderProgress = () => {
    if (step === 0 && !doc) return null;
    return (
      <div className="overflow-x-auto pb-3 mb-4 -mx-4 px-4">
        <div className="flex items-start gap-0 min-w-max">
          {allSteps.map((label: string, i: number) => {
            const done = i < step;
            const current = i === step;
            return (
              <React.Fragment key={i}>
                {i > 0 && <div className={`flex-shrink-0 h-0.5 w-8 mt-4 ${done ? "bg-blue-500" : "bg-gray-200"}`} />}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 w-16">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    done ? "bg-blue-600 border-blue-600 text-white" :
                    current ? "bg-white border-blue-600 text-blue-700" :
                    "bg-gray-100 border-gray-200 text-gray-400"
                  }`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs text-center leading-tight font-medium px-1 ${current ? "text-blue-700" : done ? "text-gray-500" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Step 0: Document setup ─────────────────────────────────────────────────
  const renderSetup = () => (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo documento</h1>
        <p className="text-gray-500 text-sm mt-1">Configurá el tipo, área y título. Los módulos de redacción se determinan por el tipo.</p>
      </div>
      {configError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <span>No se pudo cargar la configuración.</span>
          <button type="button" onClick={loadCatalog} className="ml-auto px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-800 font-medium">
            Reintentar
          </button>
        </div>
      )}
      <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Type */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className="text-sm font-medium text-gray-700">Tipo de documento *</label>
              {docTypes.find((d: any) => d.code === setup.type)?.description && (
                <div className="relative">
                  <button type="button" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} className="text-blue-400 hover:text-blue-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {showTooltip && (
                    <div className="absolute left-0 top-6 z-20 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
                      {docTypes.find((d: any) => d.code === setup.type)?.description}
                      <div className="absolute -top-1.5 left-1.5 w-3 h-3 bg-gray-900 rotate-45" />
                    </div>
                  )}
                </div>
              )}
            </div>
            <select name="type" value={setup.type} onChange={handleSetupChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
              {docTypes.map((t: any) => <option key={t.id} value={t.code}>{t.name} ({t.code})</option>)}
            </select>
            {activeModules.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {activeModules.map((m: any) => (
                  <span key={m.key} className={`text-xs px-2 py-0.5 rounded-full ${moduleCfg[m.key as ModuleKey] === "required" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                    {m.icon} {m.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Area */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Área *</label>
            {isRestricted ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm text-gray-700 font-medium">{user?.area}</span>
                <span className="text-xs text-gray-400 ml-auto">fija</span>
              </div>
            ) : (
              <select name="area" value={setup.area} onChange={handleSetupChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                {areas.map((a: any) => <option key={a.id} value={a.name}>{a.name}{a.sector ? ` — ${a.sector}` : ""}</option>)}
              </select>
            )}
          </div>
        </div>
        {/* Title */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Título *</label>
          <input name="title" type="text" value={setup.title} onChange={handleSetupChange} required
            placeholder="Ingrese el título del documento"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        {setup.type && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
            Código generado automáticamente: <span className="font-mono font-medium text-gray-700">
              {docTypes.find((t: any) => t.code === setup.type)?.prefix ?? setup.type}-{setup.sectorCode || "SECTOR"}-{setup.siteCode || "SITIO"}-001
            </span>
          </p>
        )}
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={creating || !setup.title.trim() || !setup.type || !setup.area}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
            {creating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {creating ? "Creando..." : "Crear y comenzar redacción →"}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );

  // ── Module step ────────────────────────────────────────────────────────────
  const renderModuleStep = () => {
    if (!currentModule) return null;
    const key = currentModule.key as ModuleKey;
    const visibility = moduleCfg[key];
    const isFirst = step === 1;
    const isLast = step === activeModules.length;

    return (
      <div className="space-y-5">
        {draftId && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800">
            <span>📝</span>
            <span>Retomando borrador: <strong>{doc?.code}</strong> — {doc?.title}</span>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Module header */}
          <div className="flex items-start gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex-wrap">
            <span className="text-2xl mt-0.5">{currentModule.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-800">{currentModule.label}</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${visibility === "required" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {visibility === "required" ? "REQUERIDO" : "OPCIONAL"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{currentModule.hint}</p>
            </div>
            <button type="button" onClick={handleAiAssist} disabled={ai.loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
              {ai.loading
                ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando...</>
                : <>✨ Sugerir con IA</>}
            </button>
          </div>

          {/* Textarea */}
          <div className="p-6 space-y-4">
            <textarea
              ref={taRef}
              value={content[key] ?? ""}
              rows={10}
              onChange={e => { setContent(c => ({ ...c, [key]: e.target.value })); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
              placeholder={visibility === "required" ? "Este módulo es requerido — redacte el contenido aquí..." : "Este módulo es opcional — puede dejarlo en blanco..."}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed resize-none overflow-hidden font-mono min-h-[220px]"
            />
            {/* AI suggestion panel */}
            {ai.show && !ai.loading && ai.suggestion && (
              <div className="border border-violet-200 rounded-lg bg-violet-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-violet-800">✨ Sugerencia de IA</span>
                  <button type="button" onClick={() => setAi(a => ({ ...a, show: false }))} className="text-violet-400 hover:text-violet-600 text-xl leading-none">×</button>
                </div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white rounded p-3 max-h-52 overflow-y-auto border border-violet-100">{ai.suggestion}</pre>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={handleUseSuggestion} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg">
                    Insertar texto
                  </button>
                  <button type="button" onClick={handleAiAssist} className="px-3 py-1.5 border border-violet-300 hover:bg-violet-100 text-violet-700 text-xs font-medium rounded-lg">
                    Regenerar
                  </button>
                  <button type="button" onClick={() => setAi(a => ({ ...a, show: false }))} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs rounded-lg ml-auto">
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button type="button" onClick={handlePrev}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm transition-colors">
            ← Anterior
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={handleSaveDraft} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg text-sm disabled:opacity-50">
              {saving ? <><div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />Guardando...</> : "💾 Guardar borrador"}
            </button>
            <button type="button" onClick={handleNext} disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm disabled:opacity-50">
              {saving ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</> : isLast ? "Revisar →" : "Continuar →"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Review step ────────────────────────────────────────────────────────────
  const renderReview = () => {
    const requiredEmpty = activeModules.filter((m: any) => moduleCfg[m.key as ModuleKey] === "required" && !content[m.key]?.trim());
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Revisión final del borrador</h2>
          <p className="text-gray-500 text-sm mt-1">Documento: <strong>{doc?.code}</strong> — {doc?.title}</p>
        </div>
        {requiredEmpty.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
            ⚠️ {requiredEmpty.length} módulo{requiredEmpty.length > 1 ? "s" : ""} requerido{requiredEmpty.length > 1 ? "s" : ""} sin completar: {requiredEmpty.map((m: any) => m.label).join(", ")}
          </div>
        )}
        <div className="space-y-3">
          {activeModules.map((m: any, i: number) => {
            const key = m.key as ModuleKey;
            const vis = moduleCfg[key];
            const text = content[key]?.trim() ?? "";
            const isEmpty = !text;
            const isRequired = vis === "required";
            return (
              <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
                  <span className="text-lg">{m.icon}</span>
                  <span className="font-semibold text-gray-800 text-sm">{m.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isRequired ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                    {isRequired ? "REQUERIDO" : "OPCIONAL"}
                  </span>
                  <div className="ml-auto flex items-center gap-3">
                    {isEmpty
                      ? <span className={`text-xs font-medium ${isRequired ? "text-red-600" : "text-gray-400"}`}>{isRequired ? "✗ Sin completar" : "— No completado"}</span>
                      : <span className="text-xs font-medium text-green-600">✓ Completado ({text.length} caracteres)</span>
                    }
                    <button type="button" onClick={() => setStep(i + 1)} className="text-xs text-blue-600 hover:underline">Editar</button>
                  </div>
                </div>
                {text && (
                  <div className="px-5 py-3 text-xs text-gray-600 font-mono whitespace-pre-wrap max-h-24 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]">
                    {text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button type="button" onClick={() => setStep(activeModules.length)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
            ← Volver a editar
          </button>
          <button type="button" onClick={() => { toast.success("Borrador listo. Podés enviarlo a revisión desde el documento."); navigate(`/documents/${doc?.id}`); }}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm transition-colors">
            ✓ Ver documento
          </button>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-2">
      {renderProgress()}
      {step === 0 && renderSetup()}
      {step >= 1 && !isReviewStep && renderModuleStep()}
      {isReviewStep && renderReview()}
    </div>
  );
}