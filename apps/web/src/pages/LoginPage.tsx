import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { useAuthStore } from "../store/auth.js";
import { apiService } from "../services/api.js";
import toast from "react-hot-toast";

const DEMO_USERS: Record<string, { password: string; user: any; token: string }> = {
  "admin@centenario.local": {
    password: "Admin@2026!",
    token: "demo-token-admin",
    user: { id: "1", email: "admin@centenario.local", firstName: "Admin", lastName: "Centenario", role: "ADMIN" },
  },
  "calidad@centenario.local": {
    password: "Calidad@2026!",
    token: "demo-token-calidad",
    user: { id: "2", email: "calidad@centenario.local", firstName: "Calidad", lastName: "Centenario", role: "QUALITY_MANAGER" },
  },
};

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [warmingUp, setWarmingUp] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: "admin@centenario.local",
    password: "Admin@2026!",
  });
  const warmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      warmupTimerRef.current = setTimeout(() => setWarmingUp(true), 8000);
    } else {
      if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current);
      setWarmingUp(false);
    }
    return () => { if (warmupTimerRef.current) clearTimeout(warmupTimerRef.current); };
  }, [isLoading]);

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
          {warmingUp && (
            <p className="text-xs text-center text-amber-600 animate-pulse">
              El servidor está iniciando, aguardá unos segundos…
            </p>
          )}
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
          <p className="font-medium mb-2">Credenciales de acceso:</p>
          <ul className="space-y-1 text-xs">
            <li><strong>Admin:</strong> admin@centenario.local / Admin@2026!</li>
            <li><strong>Calidad:</strong> calidad@centenario.local / Calidad@2026!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
