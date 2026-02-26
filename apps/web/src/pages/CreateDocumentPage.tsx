import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { apiService } from "../services/api.js";
import toast from "react-hot-toast";

export function CreateDocumentPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ code: "", title: "", description: "", type: "SOP", area: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    try {
      const response = await apiService.createDocument(formData);
      toast.success("Documento creado exitosamente");
      navigate(`/documents/${response.data.data.id}`);
    } catch (error: any) {
      const message = error.response?.data?.error || "Error al crear el documento";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Crear Documento</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <Input label="Codigo del Documento *" name="code" value={formData.code} onChange={handleChange} error={errors.code} placeholder="DOC-001" required />
        <Input label="Titulo *" name="title" value={formData.title} onChange={handleChange} error={errors.title} placeholder="Titulo del Documento" required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Descripcion</label>
          <textarea name="description" value={formData.description} onChange={handleChange}
            placeholder="Descripcion del documento..." rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
            <select name="type" value={formData.type} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="SOP">SOP</option>
              <option value="POLICY">Politica</option>
              <option value="WI">Instruccion de Trabajo</option>
              <option value="FORM">Formulario</option>
              <option value="RECORD">Registro</option>
            </select>
          </div>
          <Input label="Area *" name="area" value={formData.area} onChange={handleChange} error={errors.area} placeholder="Operaciones, Calidad, etc." required />
        </div>
        <div className="flex gap-4">
          <Button type="submit" isLoading={isLoading} size="lg">Crear Documento</Button>
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
