import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.js";
import { apiService } from "../services/api.js";
import toast from "react-hot-toast";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  QUALITY_MANAGER: "Gestión de Calidad",
  DOCUMENT_OWNER: "Propietario de Documentos",
  REVIEWER: "Revisor",
  APPROVER: "Aprobador",
  READER: "Lector",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  QUALITY_MANAGER: "bg-purple-100 text-purple-700",
  DOCUMENT_OWNER: "bg-blue-100 text-blue-700",
  REVIEWER: "bg-amber-100 text-amber-700",
  APPROVER: "bg-emerald-100 text-emerald-700",
  READER: "bg-gray-100 text-gray-600",
};

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await apiService.getUnreadCount();
        setUnreadCount(response.data.data.count);
      } catch (error) {
        // Silently fail
      }
    };

    const interval = setInterval(fetchUnreadCount, 5000);
    fetchUnreadCount();

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Sesion cerrada");
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo-centenario.png" alt="Centenario" className="h-10 w-auto" />
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-gray-900 leading-tight">Sistema de Gestión</div>
                <div className="text-sm font-bold text-blue-600 leading-tight">Documental</div>
              </div>
            </Link>

            {user && (
              <div className="flex items-center gap-6">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive("/dashboard") || isActive("/")
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Dashboard
                </Link>

                <Link
                  to="/flujo-iso"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive("/flujo-iso")
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Flujo ISO
                </Link>

                <Link
                  to="/documents"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive("/documents")
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Documentos
                </Link>

                <Link
                  to="/notifications"
                  className={`relative px-3 py-2 rounded-md text-sm font-medium ${
                    isActive("/notifications")
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Notificaciones
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {(user.role === "ADMIN" || user.role === "QUALITY_MANAGER") && (
                  <>
                    <Link
                      to="/users"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive("/users")
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Usuarios
                    </Link>

                    <Link
                      to="/audit"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive("/audit")
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Auditoría
                    </Link>

                    <Link
                      to="/config"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive("/config")
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Configuración
                    </Link>
                  </>
                )}

                <div className="relative" ref={dropdownRef}>
                  {/* Trigger button */}
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      showDropdown ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {/* Avatar */}
                    <span className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                    </span>
                    <span className="hidden sm:inline">{user.firstName} {user.lastName}</span>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown panel */}
                  {showDropdown && (
                    <div
                      className="absolute right-0 mt-2 w-72 bg-white rounded-xl z-50 overflow-hidden"
                      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
                    >
                      {/* Profile header */}
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-sm">
                            {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-600"
                            }`}>
                              {ROLE_LABELS[user.role] ?? user.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2.5 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{user.email}</span>
                        </div>
                        {(user as any).area && (
                          <div className="flex items-center gap-2.5 text-xs text-gray-600">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>Área: <span className="font-medium text-gray-800">{(user as any).area}</span></span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>Rol: <span className="font-medium text-gray-800">{ROLE_LABELS[user.role] ?? user.role}</span></span>
                        </div>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 px-3 py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

