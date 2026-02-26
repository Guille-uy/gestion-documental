import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button.js";
import { Input } from "../components/Input.js";
import { useAuthStore } from "../store/auth.js";
import { apiService } from "../services/api.js";
import toast from "react-hot-toast";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: "admin@dms.local",
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

      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.error || "Login failed";
      toast.error(message);
      setErrors({ form: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Management System</h1>
        <p className="text-gray-600 mb-8">Sign in to your account</p>

        {errors.form && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="your@email.com"
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
            size="lg"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
          <p className="font-medium mb-2">Demo Credentials:</p>
          <ul className="space-y-1 text-xs">
            <li><strong>Admin:</strong> admin@dms.local / Admin@12345</li>
            <li><strong>Document Owner:</strong> owner@dms.local / Owner@12345</li>
            <li><strong>Reviewer:</strong> reviewer@dms.local / Reviewer@12345</li>
            <li><strong>Approver:</strong> approver@dms.local / Approver@12345</li>
            <li><strong>Reader:</strong> reader@dms.local / Reader@12345</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
