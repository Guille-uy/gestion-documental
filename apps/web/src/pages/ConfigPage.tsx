import React, { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { apiService } from "../services/api.js";
import { useAuthStore } from "../store/auth.js";
import toast from "react-hot-toast";

type Tab = "areas" | "tipos" | "catalogos" | "modulos";

export function ConfigPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("areas");
  const [areas, setAreas] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [isLoadingTipos, setIsLoadingTipos] = useState(false);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showTipoForm, setShowTipoForm] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [editingTipo, setEditingTipo] = useState<any>(null);
  const [areaForm, setAreaForm] = useState({ name: "", code: "", description: "", folder: "", site: "", siteCode: "", sector: "", sectorCode: "" });
  const [tipoForm, setTipoForm] = useState({ name: "", code: "", prefix: "", description: "", requiresElaborado: true, requiresRevisado: true, requiresAprobado: true });

  const areaFormRef = useRef<HTMLFormElement>(null);

  /* ── Module config constants ── */
  const MODULE_KEYS = ["objetivo", "alcance", "responsabilidades", "docsRelacionados", "descripcion", "controlCambios"] as const;
  const MODULE_LABELS: Record<string, string> = { objetivo: "🎯 Objetivo", alcance: "📐 Alcance", responsabilidades: "👥 Responsab.", docsRelacionados: "🔗 Docs rel.", descripcion: "📝 Descripción", controlCambios: "📋 Ctrl. cambios" };
  const DEFAULT_MOD_CFG: Record<string, Record<string, string>> = {
    PO:{objetivo:"required",alcance:"required",responsabilidades:"optional",docsRelacionados:"optional",descripcion:"required",controlCambios:"required"},
    MN:{objetivo:"required",alcance:"required",responsabilidades:"optional",docsRelacionados:"optional",descripcion:"required",controlCambios:"required"},
    DM:{objetivo:"required",alcance:"required",responsabilidades:"optional",docsRelacionados:"optional",descripcion:"required",controlCambios:"required"},
    PR:{objetivo:"required",alcance:"required",responsabilidades:"optional",docsRelacionados:"optional",descripcion:"required",controlCambios:"required"},
    IT:{objetivo:"optional",alcance:"optional",responsabilidades:"optional",docsRelacionados:"optional",descripcion:"required",controlCambios:"required"},
    PT:{objetivo:"required",alcance:"required",responsabilidades:"optional",docsRelacionados:"optional",descripcion:"required",controlCambios:"required"},
    RG:{objetivo:"hidden",alcance:"hidden",responsabilidades:"hidden",docsRelacionados:"hidden",descripcion:"optional",controlCambios:"hidden"},
    LI:{objetivo:"hidden",alcance:"hidden",responsabilidades:"hidden",docsRelacionados:"hidden",descripcion:"optional",controlCambios:"hidden"},
    PL:{objetivo:"hidden",alcance:"hidden",responsabilidades:"hidden",docsRelacionados:"hidden",descripcion:"optional",controlCambios:"hidden"},
    IN:{objetivo:"hidden",alcance:"hidden",responsabilidades:"hidden",docsRelacionados:"hidden",descripcion:"optional",controlCambios:"hidden"},
    FT:{objetivo:"hidden",alcance:"hidden",responsabilidades:"hidden",docsRelacionados:"hidden",descripcion:"required",controlCambios:"hidden"},
    DF:{objetivo:"hidden",alcance:"hidden",responsabilidades:"hidden",docsRelacionados:"hidden",descripcion:"required",controlCambios:"hidden"},
    AR:{objetivo:"hidden",alcance:"hidden",responsabilidades:"hidden",docsRelacionados:"hidden",descripcion:"required",controlCambios:"hidden"},
    ES:{objetivo:"hidden",alcance:"hidden",responsabilidades:"hidden",docsRelacionados:"hidden",descripcion:"required",controlCambios:"hidden"},
    CE:{objetivo:"hidden",alcance:"hidden",responsabilidades:"hidden",docsRelacionados:"hidden",descripcion:"required",controlCambios:"hidden"},
    CI:{objetivo:"hidden",alcance:"hidden",responsabilidades:"hidden",docsRelacionados:"hidden",descripcion:"required",controlCambios:"hidden"},
    AN:{objetivo:"hidden",alcance:"hidden",responsabilidades:"hidden",docsRelacionados:"hidden",descripcion:"optional",controlCambios:"required"},
    OG:{objetivo:"hidden",alcance:"hidden",responsabilidades:"hidden",docsRelacionados:"hidden",descripcion:"optional",controlCambios:"required"},
    CT:{objetivo:"optional",alcance:"hidden",responsabilidades:"optional",docsRelacionados:"hidden",descripcion:"optional",controlCambios:"hidden"},
  };

  const [moduleConfigs, setModuleConfigs] = useState<Record<string, Record<string, string>>>({});
  const [savingModuleCfg, setSavingModuleCfg] = useState<string | null>(null);

  /* ── Catálogos (localStorage) ── */
  const CATALOG_KEY = "dms_catalogs_v1";
  const _load = () => { try { return JSON.parse(localStorage.getItem(CATALOG_KEY) || "{}"); } catch { return {}; } };
  const _save = (data: any) => localStorage.setItem(CATALOG_KEY, JSON.stringify(data));

  const [carpetas, setCarpetasRaw] = useState<string[]>(() => _load().carpetas ?? ["01 Gestión general del SGI","02 Gestión documental","03 Procesos estratégicos","04 Soporte al negocio","05 Gestión operativa","06 Inocuidad alimentaria"]);
  const [sitios, setSitiosRaw] = useState<{name:string;code:string}[]>(() => _load().sitios ?? [{name:"Corporativo",code:"CO"},{name:"Fábrica de elaboración",code:"FE"},{name:"Centro de distribución",code:"CD"}]);
  const [sectores, setSectoresRaw] = useState<{name:string;code:string}[]>(() => _load().sectores ?? [{name:"Recursos humanos",code:"RH"},{name:"Seguridad y salud ocupacional",code:"SYSO"},{name:"Medio ambiente",code:"MA"},{name:"Compras",code:"CMP"},{name:"Finanzas",code:"FIN"},{name:"Data Science",code:"DS"},{name:"Tecnologías de la información",code:"TI"},{name:"Seguridad",code:"SEG"},{name:"Comercial",code:"COM"},{name:"I+D+i",code:"IDI"},{name:"Mantenimiento",code:"MT"},{name:"Aseguramiento de calidad",code:"AC"},{name:"Producción",code:"PROD"},{name:"Operaciones logísticas",code:"OL"}]);

  const [newCarpeta, setNewCarpeta] = useState("");
  const [newSitio, setNewSitio] = useState({ name: "", code: "" });
  const [newSector, setNewSector] = useState({ name: "", code: "" });

  const setCarpetas = (v: string[]) => { setCarpetasRaw(v); _save({ ..._load(), carpetas: v }); };
  const setSitios = (v: {name:string;code:string}[]) => { setSitiosRaw(v); _save({ ..._load(), sitios: v }); };
  const setSectores = (v: {name:string;code:string}[]) => { setSectoresRaw(v); _save({ ..._load(), sectores: v }); };

  useEffect(() => { fetchAreas(); fetchTipos(); }, []);

  // Sync module configs from tipos
  useEffect(() => {
    if (tipos.length === 0) return;
    setModuleConfigs(prev => {
      const next = { ...prev };
      tipos.forEach((t: any) => {
        if (!next[t.id]) next[t.id] = (t.moduleConfig as Record<string, string>) ?? DEFAULT_MOD_CFG[t.code] ?? {};
      });
      return next;
    });
  }, [tipos]);

  const handleSaveModuleConfig = async (tipoId: string) => {
    const cfg = moduleConfigs[tipoId];
    if (!cfg) return;
    setSavingModuleCfg(tipoId);
    try {
      await apiService.updateDocumentType(tipoId, { moduleConfig: cfg });
      toast.success("Configuración de módulos guardada");
      await fetchTipos();
    } catch { toast.error("Error guardando configuración"); }
    finally { setSavingModuleCfg(null); }
  };

  const fetchAreas = async () => {
    setIsLoadingAreas(true);
    try {
      const r = await apiService.getAreas(true);
      setAreas(r.data.data || []);
    } catch { toast.error("Error al cargar áreas"); }
    finally { setIsLoadingAreas(false); }
  };

  const fetchTipos = async () => {
    setIsLoadingTipos(true);
    try {
      const r = await apiService.getDocumentTypes(true);
      setTipos(r.data.data || []);
    } catch { toast.error("Error al cargar tipos"); }
    finally { setIsLoadingTipos(false); }
  };

  const handleAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: areaForm.name,
        description: areaForm.description,
        folder: areaForm.folder || undefined,
        site: areaForm.site || undefined,
        siteCode: areaForm.siteCode ? areaForm.siteCode.toUpperCase() : undefined,
        sector: areaForm.sector || undefined,
        sectorCode: areaForm.sectorCode ? areaForm.sectorCode.toUpperCase() : undefined,
      };
      if (editingArea) {
        await apiService.updateArea(editingArea.id, payload);
        toast.success("Área actualizada");
      } else {
        await apiService.createArea({ ...payload, code: areaForm.code.toUpperCase() });
        toast.success("Área creada");
      }
      setShowAreaForm(false);
      setEditingArea(null);
      setAreaForm({ name: "", code: "", description: "", folder: "", site: "", siteCode: "", sector: "", sectorCode: "" });
      fetchAreas();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al guardar área");
    }
  };

  const handleTipoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTipo) {
        await apiService.updateDocumentType(editingTipo.id, { name: tipoForm.name, prefix: tipoForm.prefix, description: tipoForm.description, requiresElaborado: tipoForm.requiresElaborado, requiresRevisado: tipoForm.requiresRevisado, requiresAprobado: tipoForm.requiresAprobado });
        toast.success("Tipo actualizado");
      } else {
        await apiService.createDocumentType(tipoForm);
        toast.success("Tipo de documento creado");
      }
      setShowTipoForm(false);
      setEditingTipo(null);
      setTipoForm({ name: "", code: "", prefix: "", description: "", requiresElaborado: true, requiresRevisado: true, requiresAprobado: true });
      fetchTipos();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al guardar tipo");
    }
  };

  const toggleAreaActive = async (area: any) => {
    try {
      await apiService.updateArea(area.id, { isActive: !area.isActive });
      toast.success(area.isActive ? "Área desactivada" : "Área activada");
      fetchAreas();
    } catch { toast.error("Error al actualizar"); }
  };

  const toggleTipoActive = async (tipo: any) => {
    try {
      await apiService.updateDocumentType(tipo.id, { isActive: !tipo.isActive });
      toast.success(tipo.isActive ? "Tipo desactivado" : "Tipo activado");
      fetchTipos();
    } catch { toast.error("Error al actualizar"); }
  };

  const startEditArea = (area: any) => {
    setEditingArea(area);
    setAreaForm({ name: area.name, code: area.code, description: area.description || "", folder: area.folder || "", site: area.site || "", siteCode: area.siteCode || "", sector: area.sector || "", sectorCode: area.sectorCode || "" });
    setShowAreaForm(true);
    setTimeout(() => areaFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  const startEditTipo = (tipo: any) => {
    setEditingTipo(tipo);
    setTipoForm({ name: tipo.name, code: tipo.code, prefix: tipo.prefix, description: tipo.description || "", requiresElaborado: tipo.requiresElaborado !== false, requiresRevisado: tipo.requiresRevisado !== false, requiresAprobado: tipo.requiresAprobado !== false });
    setShowTipoForm(true);
  };

  const canEdit = user?.role === "ADMIN" || user?.role === "QUALITY_MANAGER";

  const activeAreas = areas.filter(a => a.isActive).length;
  const activeTipos = tipos.filter(t => t.isActive).length;

  /* ── helpers ── */
  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
      active
        ? "bg-white text-blue-700 shadow-sm"
        : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
    }`;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div
        className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-100"
        style={{ borderTop: "3px solid #3b82f6" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="text-2xl">⚙️</span> Configuración del Sistema
            </h1>
            <p className="text-gray-500 text-sm">
              Gestión de áreas organizativas y tipos de documento para la plataforma documental.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Áreas activas", value: activeAreas, total: areas.length, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
              { label: "Tipos activos", value: activeTipos, total: tipos.length, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl px-4 py-2.5 text-center min-w-[80px] border ${s.bg}`}>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                <div className={`text-xs ${s.color} opacity-70`}>de {s.total} totales</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 w-fit">
        <button className={tabClass(tab === "areas")} onClick={() => setTab("areas")}>
          🗂 Áreas
          {areas.length > 0 && (
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === "areas" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}>
              {activeAreas}/{areas.length}
            </span>
          )}
        </button>
        <button className={tabClass(tab === "tipos")} onClick={() => setTab("tipos")}>
          📄 Tipos de Documento
          {tipos.length > 0 && (
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === "tipos" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}>
              {activeTipos}/{tipos.length}
            </span>
          )}
        </button>
        {canEdit && (
          <button className={tabClass(tab === "catalogos")} onClick={() => setTab("catalogos")}>
            🗃 Catálogos
          </button>
        )}
        {canEdit && (
          <button className={tabClass(tab === "modulos")} onClick={() => setTab("modulos")}>
            🧩 Módulos
          </button>
        )}
      </div>

      {/* ── AREAS TAB ── */}
      {tab === "areas" && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <p className="text-gray-500 text-sm">
              Las áreas definen las unidades organizativas asociadas a los documentos.
            </p>
            {canEdit && (
              <Button size="sm" onClick={() => { setEditingArea(null); setAreaForm({ name: "", code: "", description: "", folder: "", site: "", siteCode: "", sector: "", sectorCode: "" }); setShowAreaForm(!showAreaForm); }}>
                {showAreaForm && !editingArea ? "Cancelar" : "+ Nueva Área"}
              </Button>
            )}
          </div>

          {showAreaForm && (
            <form ref={areaFormRef} onSubmit={handleAreaSubmit} className="bg-white rounded-xl shadow-sm p-5 sm:p-6 space-y-4 border border-gray-100 border-l-4 border-l-blue-500">
              <h3 className="font-bold text-gray-900">{editingArea ? "Editar Área" : "Nueva Área"}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Nombre del área *" value={areaForm.name} onChange={e => setAreaForm(f => ({ ...f, name: e.target.value }))} required placeholder="ej: Calidad" />
                <Input label="Código único *" value={areaForm.code} onChange={e => setAreaForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required placeholder="ej: AC-FE-CAL" disabled={!!editingArea} />
                <Input label="Descripción" value={areaForm.description} onChange={e => setAreaForm(f => ({ ...f, description: e.target.value }))} placeholder="Opcional" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carpeta / Proceso</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={areaForm.folder} onChange={e => setAreaForm(f => ({ ...f, folder: e.target.value }))}>
                    <option value="">— seleccionar —</option>
                    {carpetas.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sitio</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={areaForm.site} onChange={e => {
                    const found = sitios.find(s => s.name === e.target.value);
                    setAreaForm(f => ({ ...f, site: e.target.value, siteCode: found?.code || f.siteCode }));
                  }}>
                    <option value="">— seleccionar —</option>
                    {sitios.map(s => <option key={s.name} value={s.name}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector / Proceso</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={areaForm.sector} onChange={e => {
                    const found = sectores.find(s => s.name === e.target.value);
                    setAreaForm(f => ({ ...f, sector: e.target.value, sectorCode: found?.code || f.sectorCode }));
                  }}>
                    <option value="">— sin sector —</option>
                    {sectores.map(s => <option key={s.name} value={s.name}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                <Input label="Código de sector (auto)" value={areaForm.sectorCode} onChange={e => setAreaForm(f => ({ ...f, sectorCode: e.target.value.toUpperCase() }))} placeholder="ej: AC" />
              </div>
              {(areaForm.sectorCode || areaForm.siteCode) && (
                <div className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                  Código de documento ejemplo: <span className="font-mono font-bold">PR-{areaForm.sectorCode||"SECTOR"}-{areaForm.siteCode||"SITIO"}-001</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" size="sm">{editingArea ? "Actualizar" : "Crear Área"}</Button>
                <button type="button" onClick={() => { setShowAreaForm(false); setEditingArea(null); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {isLoadingAreas ? (
              <div className="p-10 text-center text-gray-400 text-sm">Cargando áreas…</div>
            ) : areas.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">No hay áreas configuradas</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Código</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nombre</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Carpeta</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Sitio</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Sector</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                      {canEdit && <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {areas.map(area => (
                      <tr key={area.id} className={`transition hover:bg-blue-50/40 ${!area.isActive ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">{area.code}</span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-gray-900">{area.name}</td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs hidden md:table-cell">{area.folder || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          {area.siteCode ? <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{area.siteCode}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          {area.sectorCode ? <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">{area.sectorCode}</span> : <span className="text-gray-300">—</span>}
                          {area.sector && <span className="ml-1.5 text-xs text-gray-500">{area.sector}</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${area.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            {area.isActive ? "✓ Activa" : "Inactiva"}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex gap-1.5 justify-end flex-wrap">
                              <button onClick={() => startEditArea(area)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 px-2.5 py-1 rounded-lg transition-all">
                                ✎ Editar
                              </button>
                              <button onClick={() => toggleAreaActive(area)} className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${area.isActive ? "text-red-500 hover:bg-red-500 hover:text-white" : "text-emerald-600 hover:bg-emerald-600 hover:text-white"}`}>
                                {area.isActive ? "✕ Desactivar" : "✓ Activar"}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TIPOS TAB ── */}
      {tab === "tipos" && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <p className="text-gray-500 text-sm">Los tipos determinan la nomenclatura del código (prefijo) y categorizan los documentos.</p>
            {canEdit && (
              <Button size="sm" onClick={() => { setEditingTipo(null); setTipoForm({ name: "", code: "", prefix: "", description: "", requiresElaborado: true, requiresRevisado: true, requiresAprobado: true }); setShowTipoForm(!showTipoForm); }}>
                {showTipoForm && !editingTipo ? "Cancelar" : "+ Nuevo Tipo"}
              </Button>
            )}
          </div>

          {showTipoForm && (
            <form onSubmit={handleTipoSubmit} className="bg-white rounded-xl shadow-sm p-5 sm:p-6 space-y-4 border border-gray-100 border-l-4 border-l-blue-500">
              <h3 className="font-bold text-gray-900">{editingTipo ? "Editar Tipo" : "Nuevo Tipo de Documento"}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Código interno *" value={tipoForm.code} onChange={e => setTipoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required placeholder="ej: SOP" disabled={!!editingTipo} />
                <Input label="Prefijo para código *" value={tipoForm.prefix} onChange={e => setTipoForm(f => ({ ...f, prefix: e.target.value.toUpperCase() }))} required placeholder="ej: PO" />
                <div className="flex items-end pb-1">
                  <p className="text-sm text-gray-500">Genera: <span className="font-mono font-semibold text-blue-700">{tipoForm.prefix || "PO"}-SECTOR-SITIO-001</span></p>
                </div>
              </div>
              <Input label="Nombre descriptivo *" value={tipoForm.name} onChange={e => setTipoForm(f => ({ ...f, name: e.target.value }))} required placeholder="ej: Procedimiento Operativo" />
              <Input label="Descripción" value={tipoForm.description} onChange={e => setTipoForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del tipo (opcional)" />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Workflow requerido</p>
                <div className="flex flex-wrap gap-4">
                  {(["requiresElaborado", "requiresRevisado", "requiresAprobado"] as const).map(field => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded accent-blue-600" checked={tipoForm[field]}
                        onChange={e => setTipoForm(f => ({ ...f, [field]: e.target.checked }))} />
                      <span className="text-sm text-gray-700">{field === "requiresElaborado" ? "① Elaborado" : field === "requiresRevisado" ? "② Revisado" : "③ Aprobado"}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">{editingTipo ? "Actualizar" : "Crear Tipo"}</Button>
                <button type="button" onClick={() => { setShowTipoForm(false); setEditingTipo(null); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {isLoadingTipos ? (
              <div className="p-10 text-center text-gray-400 text-sm">Cargando tipos…</div>
            ) : tipos.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">No hay tipos configurados</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Código</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Prefijo</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nombre</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                      {canEdit && <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tipos.map(tipo => (
                      <tr key={tipo.id} className={`transition hover:bg-purple-50/30 ${!tipo.isActive ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs">{tipo.code}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">{tipo.prefix}</span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-gray-900">{tipo.name}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tipo.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            {tipo.isActive ? "✓ Activo" : "Inactivo"}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex gap-1.5 justify-end flex-wrap">
                              <button onClick={() => startEditTipo(tipo)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 px-2.5 py-1 rounded-lg transition-all">
                                ✎ Editar
                              </button>
                              <button onClick={() => toggleTipoActive(tipo)} className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${tipo.isActive ? "text-red-500 hover:bg-red-500 hover:text-white" : "text-emerald-600 hover:bg-emerald-600 hover:text-white"}`}>
                                {tipo.isActive ? "✕ Desactivar" : "✓ Activar"}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
            <strong>💡 Convención de código:</strong> Los documentos reciben un código automático según el tipo, sector y sitio:{" "}
            <span className="font-mono font-bold">[TIPO]-[SECTOR]-[SITIO]-[NNN]</span>.
            El correlativo se incrementa automáticamente por combinación tipo+sector+sitio.
          </div>
        </div>
      )}

      {/* ── CATÁLOGOS TAB ── */}
      {tab === "catalogos" && (
        <div className="space-y-5">
          <p className="text-gray-500 text-sm">Administrá las opciones disponibles en los desplegables del formulario de áreas. Los cambios se guardan en el navegador.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* ── Carpetas ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-sm">📁 Carpetas / Procesos</h3>
                <span className="text-xs text-gray-400">{carpetas.length}</span>
              </div>
              <ul className="divide-y divide-gray-50">
                {carpetas.map((c, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 group">
                    <span className="text-sm text-gray-700">{c}</span>
                    <button onClick={() => setCarpetas(carpetas.filter((_, j) => j !== i))}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs font-medium transition-all" title="Eliminar">✕</button>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <input value={newCarpeta} onChange={e => setNewCarpeta(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && newCarpeta.trim()) { setCarpetas([...carpetas, newCarpeta.trim()]); setNewCarpeta(""); } }}
                  placeholder="Nueva carpeta…" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => { if(newCarpeta.trim()){ setCarpetas([...carpetas, newCarpeta.trim()]); setNewCarpeta(""); } }}
                  className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium">+</button>
              </div>
            </div>

            {/* ── Sitios ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-sm">🏢 Sitios</h3>
                <span className="text-xs text-gray-400">{sitios.length}</span>
              </div>
              <ul className="divide-y divide-gray-50">
                {sitios.map((s, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 group">
                    <div>
                      <span className="text-sm text-gray-700">{s.name}</span>
                      <span className="ml-2 font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{s.code}</span>
                    </div>
                    <button onClick={() => setSitios(sitios.filter((_, j) => j !== i))}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs font-medium transition-all" title="Eliminar">✕</button>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                <div className="flex gap-2">
                  <input value={newSitio.name} onChange={e => setNewSitio(v => ({ ...v, name: e.target.value }))}
                    placeholder="Nombre…" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={newSitio.code} onChange={e => setNewSitio(v => ({ ...v, code: e.target.value.toUpperCase() }))}
                    placeholder="Cód" maxLength={5} className="w-16 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase" />
                </div>
                <button onClick={() => { if(newSitio.name.trim() && newSitio.code.trim()){ setSitios([...sitios, { name: newSitio.name.trim(), code: newSitio.code.trim() }]); setNewSitio({ name:"", code:"" }); } }}
                  className="w-full bg-blue-600 text-white text-sm py-1.5 rounded-lg hover:bg-blue-700 font-medium">+ Agregar sitio</button>
              </div>
            </div>

            {/* ── Sectores ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-sm">🏷 Sectores / Procesos</h3>
                <span className="text-xs text-gray-400">{sectores.length}</span>
              </div>
              <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {sectores.map((s, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 group">
                    <div>
                      <span className="text-sm text-gray-700">{s.name}</span>
                      <span className="ml-2 font-mono text-xs font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">{s.code}</span>
                    </div>
                    <button onClick={() => setSectores(sectores.filter((_, j) => j !== i))}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs font-medium transition-all" title="Eliminar">✕</button>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                <div className="flex gap-2">
                  <input value={newSector.name} onChange={e => setNewSector(v => ({ ...v, name: e.target.value }))}
                    placeholder="Nombre…" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={newSector.code} onChange={e => setNewSector(v => ({ ...v, code: e.target.value.toUpperCase() }))}
                    placeholder="Cód" maxLength={8} className="w-16 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase" />
                </div>
                <button onClick={() => { if(newSector.name.trim() && newSector.code.trim()){ setSectores([...sectores, { name: newSector.name.trim(), code: newSector.code.trim() }]); setNewSector({ name:"", code:"" }); } }}
                  className="w-full bg-blue-600 text-white text-sm py-1.5 rounded-lg hover:bg-blue-700 font-medium">+ Agregar sector</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MÓDULOS TAB ── */}
      {tab === "modulos" && canEdit && (
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">
            Configurá qué secciones son requeridas, opcionales u ocultas para cada tipo de documento. Los cambios se aplican al asistente de redacción.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm" style={{ minWidth: "860px" }}>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider" style={{ minWidth: "140px" }}>Tipo</th>
                  {MODULE_KEYS.map(k => (
                    <th key={k} className="text-center px-2 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">{MODULE_LABELS[k]}</th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs text-gray-400 font-normal">Guardar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tipos.filter((t: any) => t.isActive).map((t: any) => {
                  const cfg = moduleConfigs[t.id] ?? DEFAULT_MOD_CFG[t.code] ?? {};
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800 text-sm">{t.name}</div>
                        <div className="text-xs font-mono text-gray-400">{t.code}</div>
                      </td>
                      {MODULE_KEYS.map(key => {
                        const val = cfg[key] ?? "hidden";
                        return (
                          <td key={key} className="px-2 py-3 text-center">
                            <select
                              value={val}
                              onChange={e => setModuleConfigs(c => ({ ...c, [t.id]: { ...(c[t.id] ?? DEFAULT_MOD_CFG[t.code] ?? {}), [key]: e.target.value } }))}
                              className={`text-xs px-2 py-1 rounded-lg border font-semibold cursor-pointer ${
                                val === "required" ? "bg-blue-50 border-blue-200 text-blue-700" :
                                val === "optional" ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                                "bg-gray-50 border-gray-200 text-gray-400"
                              }`}
                            >
                              <option value="required">Requerido</option>
                              <option value="optional">Opcional</option>
                              <option value="hidden">Oculto</option>
                            </select>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleSaveModuleConfig(t.id)}
                          disabled={savingModuleCfg === t.id}
                          className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
                        >
                          {savingModuleCfg === t.id ? "..." : "💾"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />Requerido = obligatorio para finalizar el borrador.{" "}
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />Opcional = visible pero no obligatorio.{" "}
            <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-1" />Oculto = no aparece en el asistente.
          </p>
        </div>
      )}

    </div>
  );
}