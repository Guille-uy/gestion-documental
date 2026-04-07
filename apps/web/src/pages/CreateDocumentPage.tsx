import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { apiService } from "../services/api.js";
import { useAuthStore } from "../store/auth.js";
import toast from "react-hot-toast";

const PRIVILEGED_ROLES = ["ADMIN", "QUALITY_MANAGER"];

export function CreateDocumentPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isRestricted = !!user && !PRIVILEGED_ROLES.includes(user.role) && !!user.area;
  const [isLoading, setIsLoading] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({ title: "", description: "", type: "", area: "", siteCode: "", sectorCode: "" });
  const [showTypeTooltip, setShowTypeTooltip] = useState(false);

  useEffect(() => {
    Promise.all([apiService.getAreas(), apiService.getDocumentTypes()])
      .then(([areasRes, typesRes]) => {
        const areasList = areasRes.data.data || [];
        const typesList = typesRes.data.data || [];
        setAreas(areasList);
        setDocTypes(typesList);
        if (typesList.length > 0) setFormData(f => ({ ...f, type: typesList[0].code }));
        // Pre-select user's area for restricted roles; default to first area for privileged
        const defaultArea = (user?.area && isRestricted)
          ? user.area
          : (areasList.length > 0 ? areasList[0].name : "");
        const firstArea = areasList.find((a: any) => a.name === defaultArea) || areasList[0];
        setFormData(f => ({ ...f, area: defaultArea, siteCode: firstArea?.siteCode || "", sectorCode: firstArea?.sectorCode || "" }));
      })
      .catch(() => toast.error("Error al cargar configuración"));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "area") {
      const selectedArea = areas.find((a: any) => a.name === value);
      setFormData(prev => ({ ...prev, area: value, siteCode: selectedArea?.siteCode || "", sectorCode: selectedArea?.sectorCode || "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type) { toast.error("Seleccione un tipo de documento"); return; }
    if (!formData.area) { toast.error("Seleccione un área"); return; }
    setIsLoading(true);
    try {
      const response = await apiService.createDocument(formData);
      toast.success("Documento creado exitosamente");
      navigate(`/documents/${response.data.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al crear el documento");
    } finally {
      setIsLoading(false);
    }
  };

  const selectClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Crear Documento</h1>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Código automático:</span> Formato <code className="bg-blue-100 px-1 rounded">TIPO-PROCESO-SITIO-NNN</code>. Ejemplo: <code className="bg-blue-100 px-1 rounded">{(() => { const t = docTypes.find((d:any)=>d.code===formData.type); return t?.prefix||"PR"; })()} -{formData.sectorCode||«SECTOR»}-{formData.siteCode||«SITIO»}-001</code>.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className="block text-sm font-medium text-gray-700">Tipo de Documento *</label>
              {docTypes.find((d:any)=>d.code===formData.type)?.description && (
                <div className="relative">
                  <button type="button" onMouseEnter={()=>setShowTypeTooltip(true)} onMouseLeave={()=>setShowTypeTooltip(false)}
                    className="text-blue-400 hover:text-blue-600 transition-colors" aria-label="Ver descripción">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                  </button>
                  {showTypeTooltip && (
                    <div className="absolute left-0 top-6 z-20 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
                      {docTypes.find((d:any)=>d.code===formData.type)?.description}
                      <div className="absolute -top-1.5 left-1.5 w-3 h-3 bg-gray-900 rotate-45" />
                    </div>
                  )}
                </div>
              )}
            </div>
            {docTypes.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Cargando tipos...</p>
            ) : (
              <select name="type" value={formData.type} onChange={handleChange} required className={selectClass}>
                {docTypes.map(t => (
                  <option key={t.id} value={t.code}>{t.name} ({t.code})</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Área *</label>
            {isRestricted ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm text-gray-700 font-medium">{user?.area}</span>
                <span className="text-xs text-gray-400 ml-auto">fija</span>
              </div>
            ) : areas.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Cargando áreas...</p>
            ) : (
              <select name="area" value={formData.area} onChange={handleChange} required className={selectClass}>
                {areas.map((a: any) => (
                  <option key={a.id} value={a.name}>{a.name}{a.sector ? ` — ${a.sector}` : a.folder ? ` — ${a.folder}` : ""} · {a.site || ""}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <Input label="Título *" name="title" value={formData.title} onChange={handleChange}
          placeholder="Ingrese el título del documento" required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
          <textarea name="description" value={formData.description} onChange={handleChange}
            placeholder="Descripción del documento (opcional)..." rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-4">
          <Button type="submit" isLoading={isLoading} size="lg" disabled={!formData.type || !formData.area || !formData.title}>
            Crear Documento
          </Button>
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
