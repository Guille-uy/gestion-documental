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
  const [areaForm, setAreaForm] = useState({ name: "", code: "", description: "" });
  const [tipoForm, setTipoForm] = useState({ name: "", code: "", prefix: "", description: "" });

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
      if (editingArea) {
        await apiService.updateArea(editingArea.id, { name: areaForm.name, description: areaForm.description });
        toast.success("Área actualizada");
      } else {
        await apiService.createArea(areaForm);
        toast.success("Área creada");
      }
      setShowAreaForm(false);
      setEditingArea(null);
      setAreaForm({ name: "", code: "", description: "" });
      fetchAreas();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al guardar área");
    }
  };

  const handleTipoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTipo) {
        await apiService.updateDocumentType(editingTipo.id, { name: tipoForm.name, prefix: tipoForm.prefix, description: tipoForm.description });
        toast.success("Tipo actualizado");
      } else {
        await apiService.createDocumentType(tipoForm);
        toast.success("Tipo de documento creado");
      }
      setShowTipoForm(false);
      setEditingTipo(null);
      setTipoForm({ name: "", code: "", prefix: "", description: "" });
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
    setAreaForm({ name: area.name, code: area.code, description: area.description || "" });
    setShowAreaForm(true);
  };

  const startEditTipo = (tipo: any) => {
    setEditingTipo(tipo);
    setTipoForm({ name: tipo.name, code: tipo.code, prefix: tipo.prefix, description: tipo.description || "" });
    setShowTipoForm(true);
  };

  const canEdit = user?.role === "ADMIN" || user?.role === "QUALITY_MANAGER";

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${active ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-500 hover:text-gray-700"}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button className={tabClass(tab === "areas")} onClick={() => setTab("areas")}>Áreas</button>
        <button className={tabClass(tab === "tipos")} onClick={() => setTab("tipos")}>Tipos de Documento</button>
      </div>

      {/* AREAS TAB */}
      {tab === "areas" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600 text-sm">Las áreas definen las unidades organizativas asociadas a los documentos.</p>
            {canEdit && (
              <Button size="sm" onClick={() => { setEditingArea(null); setAreaForm({ name: "", code: "", description: "" }); setShowAreaForm(!showAreaForm); }}>
                {showAreaForm && !editingArea ? "Cancelar" : "+ Nueva Área"}
              </Button>
            )}
          </div>

          {showAreaForm && (
            <form onSubmit={handleAreaSubmit} className="bg-white rounded-lg shadow p-6 space-y-4 border-l-4 border-blue-500">
              <h3 className="font-bold text-gray-900">{editingArea ? "Editar Área" : "Nueva Área"}</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre *" value={areaForm.name} onChange={e => setAreaForm(f => ({ ...f, name: e.target.value }))} required placeholder="ej: Calidad" />
                <Input label="Código *" value={areaForm.code} onChange={e => setAreaForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required placeholder="ej: CAL" disabled={!!editingArea} />
              </div>
              <Input label="Descripción" value={areaForm.description} onChange={e => setAreaForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del área (opcional)" />
              <div className="flex gap-2">
                <Button type="submit" size="sm">{editingArea ? "Actualizar" : "Crear Área"}</Button>
                <button type="button" onClick={() => { setShowAreaForm(false); setEditingArea(null); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoadingAreas ? (
              <p className="p-6 text-center text-gray-500">Cargando áreas...</p>
            ) : areas.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No hay áreas configuradas</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Descripción</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                    {canEdit && <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {areas.map(area => (
                    <tr key={area.id} className={!area.isActive ? "opacity-50" : ""}>
                      <td className="px-4 py-3 font-mono font-medium">{area.code}</td>
                      <td className="px-4 py-3">{area.name}</td>
                      <td className="px-4 py-3 text-gray-500">{area.description || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${area.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                          {area.isActive ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right space-x-2">
                          <button onClick={() => startEditArea(area)} className="text-blue-600 hover:underline text-xs">Editar</button>
                          <button onClick={() => toggleAreaActive(area)} className="text-gray-500 hover:underline text-xs">
                            {area.isActive ? "Desactivar" : "Activar"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TIPOS TAB */}
      {tab === "tipos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600 text-sm">Los tipos de documento determinan la nomenclatura del código (prefijo) y categorizan los documentos.</p>
            {canEdit && (
              <Button size="sm" onClick={() => { setEditingTipo(null); setTipoForm({ name: "", code: "", prefix: "", description: "" }); setShowTipoForm(!showTipoForm); }}>
                {showTipoForm && !editingTipo ? "Cancelar" : "+ Nuevo Tipo"}
              </Button>
            )}
          </div>

          {showTipoForm && (
            <form onSubmit={handleTipoSubmit} className="bg-white rounded-lg shadow p-6 space-y-4 border-l-4 border-blue-500">
              <h3 className="font-bold text-gray-900">{editingTipo ? "Editar Tipo" : "Nuevo Tipo de Documento"}</h3>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Código interno *" value={tipoForm.code} onChange={e => setTipoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required placeholder="ej: SOP" disabled={!!editingTipo} />
                <Input label="Prefijo para código *" value={tipoForm.prefix} onChange={e => setTipoForm(f => ({ ...f, prefix: e.target.value.toUpperCase() }))} required placeholder="ej: PO" />
                <div className="flex items-end pb-1">
                  <p className="text-sm text-gray-500">Genera códigos como: <span className="font-mono font-medium">{tipoForm.prefix || "PO"}-2026-0001</span></p>
                </div>
              </div>
              <Input label="Nombre descriptivo *" value={tipoForm.name} onChange={e => setTipoForm(f => ({ ...f, name: e.target.value }))} required placeholder="ej: Procedimiento Operativo" />
              <Input label="Descripción" value={tipoForm.description} onChange={e => setTipoForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del tipo de documento (opcional)" />
              <div className="flex gap-2">
                <Button type="submit" size="sm">{editingTipo ? "Actualizar" : "Crear Tipo"}</Button>
                <button type="button" onClick={() => { setShowTipoForm(false); setEditingTipo(null); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoadingTipos ? (
              <p className="p-6 text-center text-gray-500">Cargando tipos...</p>
            ) : tipos.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No hay tipos configurados</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Prefijo</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Ejemplo de código</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                    {canEdit && <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tipos.map(tipo => (
                    <tr key={tipo.id} className={!tipo.isActive ? "opacity-50" : ""}>
                      <td className="px-4 py-3 font-mono font-medium">{tipo.code}</td>
                      <td className="px-4 py-3 font-mono text-blue-700 font-medium">{tipo.prefix}</td>
                      <td className="px-4 py-3">{tipo.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-500">{tipo.prefix}-{new Date().getFullYear()}-0001</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipo.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                          {tipo.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right space-x-2">
                          <button onClick={() => startEditTipo(tipo)} className="text-blue-600 hover:underline text-xs">Editar</button>
                          <button onClick={() => toggleTipoActive(tipo)} className="text-gray-500 hover:underline text-xs">
                            {tipo.isActive ? "Desactivar" : "Activar"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
