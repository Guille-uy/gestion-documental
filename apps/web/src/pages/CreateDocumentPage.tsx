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
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    type: "SOP",
    area: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await apiService.createDocument(formData);
      toast.success("Document created successfully");
      navigate(`/documents/${response.data.data.id}`);
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to create document";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Create Document</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <Input
          label="Document Code *"
          name="code"
          value={formData.code}
          onChange={handleChange}
          error={errors.code}
          placeholder="DOC-001"
          required
        />

        <Input
          label="Title *"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          placeholder="Document Title"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Document description..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="SOP">SOP</option>
              <option value="POLICY">Policy</option>
              <option value="WI">Work Instruction</option>
              <option value="FORM">Form</option>
              <option value="RECORD">Record</option>
            </select>
          </div>

          <Input
            label="Area *"
            name="area"
            value={formData.area}
            onChange={handleChange}
            error={errors.area}
            placeholder="Operations, Quality, etc."
            required
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            isLoading={isLoading}
            size="lg"
          >
            Create Document
          </Button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
