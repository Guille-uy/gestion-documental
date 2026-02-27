import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { useAuthStore } from "../store/auth.js";
import { apiService } from "../services/api.js";
import toast from "react-hot-toast";

const DEMO_USERS: Record<string, { password: string; user: any; token: string }> = {
  "admin@centenario.net.uy": {
    password: "Admin@12345",
    token: "demo-token-admin",
    user: { id: "1", email: "admin@centenario.net.uy", firstName: "Admin", lastName: "Sistema", role: "ADMIN" },
  },
  "owner@centenario.net.uy": {
    password: "Owner@12345",
    token: "demo-token-owner",
    user: { id: "2", email: "owner@centenario.net.uy", firstName: "Propietario", lastName: "Documentos", role: "DOCUMENT_OWNER" },
  },
  "reviewer@centenario.net.uy": {
    password: "Reviewer@12345",
    token: "demo-token-reviewer",
    user: { id: "3", email: "reviewer@centenario.net.uy", firstName: "Revisor", lastName: "Calidad", role: "REVIEWER" },
  },
  "approver@centenario.net.uy": {
    password: "Approver@12345",
    token: "demo-token-approver",
    user: { id: "4", email: "approver@centenario.net.uy", firstName: "Aprobador", lastName: "Calidad", role: "APPROVER" },
  },
  "reader@centenario.net.uy": {
    password: "Reader@12345",
    token: "demo-token-reader",
    user: { id: "5", email: "reader@centenario.net.uy", firstName: "Lector", lastName: "General", role: "READER" },
  },
};

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: "admin@centenario.net.uy",
    password: "Admin@12345",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await apiService.login(formData.email, formData.password);
      const { accessToken, refreshToken, user } = response.data.data;
      setTokens(accessToken, refreshToken);
      setUser(user);
      toast.success("Sesion iniciada correctamente");
      navigate("/dashboard");
    } catch (error: any) {
      const isNetworkError = !error.response;
      if (isNetworkError) {
        const demo = DEMO_USERS[formData.email.toLowerCase()];
        if (demo && demo.password === formData.password) {
          setTokens(demo.token, demo.token);
          setUser(demo.user);
          toast.success("Sesion iniciada (modo demo)");
          navigate("/dashboard");
          return;
        }
        const msg = "Credenciales incorrectas o servidor no disponible";
        toast.error(msg);
        setErrors({ form: msg });
      } else {
        const message = error.response?.data?.error || "Error al iniciar sesion";
        toast.error(message);
        setErrors({ form: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <img src="/logo-centenario.png" alt="Centenario" className="h-24 w-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Sistema de Gestión Documental</h1>
        <p className="text-gray-500 mb-8 text-center text-sm">Ingrese a su cuenta</p>

        {errors.form && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo electronico"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="usuario@centenario.net.uy"
            required
          />

          <Input
            label="Contrasena"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="********"
            required
          />

          <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
            Ingresar
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
          <p className="font-medium mb-2">Credenciales de demostracion:</p>
          <ul className="space-y-1 text-xs">
            <li><strong>Admin:</strong> admin@centenario.net.uy / Admin@12345</li>
            <li><strong>Propietario:</strong> owner@centenario.net.uy / Owner@12345</li>
            <li><strong>Revisor:</strong> reviewer@centenario.net.uy / Reviewer@12345</li>
            <li><strong>Aprobador:</strong> approver@centenario.net.uy / Approver@12345</li>
            <li><strong>Lector:</strong> reader@centenario.net.uy / Reader@12345</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
