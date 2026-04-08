import React, { useEffect, useState } from "react";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { apiService } from "../services/api.js";
import { useAuthStore } from "../store/auth.js";
import toast from "react-hot-toast";

type Tab = "areas" | "tipos";

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

  useEffect(() => { fetchAreas(); fetchTipos(); }, []);

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
            <form onSubmit={handleAreaSubmit} className="bg-white rounded-xl shadow-sm p-5 sm:p-6 space-y-4 border border-gray-100 border-l-4 border-l-blue-500">
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
                    {["01 Gestión general del SGI","02 Gestión documental","03 Procesos estratégicos","04 Soporte al negocio","05 Gestión operativa","06 Inocuidad alimentaria"].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sitio</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={areaForm.site} onChange={e => {
                    const siteMap: Record<string,string> = { "Corporativo":"CO", "Fábrica de elaboración":"FE", "Centro de distribución":"CD" };
                    setAreaForm(f => ({ ...f, site: e.target.value, siteCode: siteMap[e.target.value] || f.siteCode }));
                  }}>
                    <option value="">— seleccionar —</option>
                    <option value="Corporativo">Corporativo (CO)</option>
                    <option value="Fábrica de elaboración">Fábrica de elaboración (FE)</option>
                    <option value="Centro de distribución">Centro de distribución (CD)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sector / Proceso</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={areaForm.sector} onChange={e => {
                    const sectorMap: Record<string,string> = { "Recursos humanos":"RH","Seguridad y salud ocupacional":"SYSO","Medio ambiente":"MA","Compras":"CMP","Finanzas":"FIN","Data Science":"DS","Tecnologías de la información":"TI","Seguridad":"SEG","Comercial":"COM","I+D+i":"IDI","Mantenimiento":"MT","Aseguramiento de calidad":"AC","Aseguramiento de Calidad":"AC","Producción":"PROD","Operaciones logísticas":"OL" };
                    setAreaForm(f => ({ ...f, sector: e.target.value, sectorCode: sectorMap[e.target.value] || f.sectorCode }));
                  }}>
                    <option value="">— sin sector —</option>
                    {["Recursos humanos","Seguridad y salud ocupacional","Medio ambiente","Compras","Finanzas","Data Science","Tecnologías de la información","Seguridad","Comercial","I+D+i","Mantenimiento","Aseguramiento de calidad","Producción","Operaciones logísticas"].map(s => <option key={s} value={s}>{s}</option>)}
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
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Ejemplo</th>
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
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border">
                            {tipo.prefix}-SECTOR-SITIO-001
                          </span>
                        </td>
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

    </div>
  );
}