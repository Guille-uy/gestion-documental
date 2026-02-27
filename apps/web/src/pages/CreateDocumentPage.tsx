import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { apiService } from "../services/api.js";
import toast from "react-hot-toast";

export function CreateDocumentPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({ title: "", description: "", type: "", area: "" });

  useEffect(() => {
    Promise.all([apiService.getAreas(), apiService.getDocumentTypes()])
      .then(([areasRes, typesRes]) => {
        const areasList = areasRes.data.data || [];
        const typesList = typesRes.data.data || [];
        setAreas(areasList);
        setDocTypes(typesList);
        if (typesList.length > 0) setFormData(f => ({ ...f, type: typesList[0].code }));
        if (areasList.length > 0) setFormData(f => ({ ...f, area: areasList[0].name }));
      })
      .catch(() => toast.error("Error al cargar configuración"));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          <span className="font-medium">Código automático:</span> El código del documento se generará automáticamente según el tipo seleccionado (ej: <code className="bg-blue-100 px-1 rounded">PO-2026-0001</code> para Procedimientos Operativos).
        </p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento *</label>
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
            {areas.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Cargando áreas...</p>
            ) : (
              <select name="area" value={formData.area} onChange={handleChange} required className={selectClass}>
                {areas.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
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
