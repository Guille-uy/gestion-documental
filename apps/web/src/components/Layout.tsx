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
              <div className="flex items-center gap-4">

                {/* ── Icon pill nav ── */}
                <div
                  className="nav-pill flex items-center gap-0.5 px-2 py-1.5 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)",
                    boxShadow: "0 4px 14px rgba(37,99,235,0.45), 0 2px 6px rgba(0,0,0,0.15)",
                    transition: "all 0.35s ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 22px rgba(37,99,235,0.6), 0 3px 10px rgba(0,0,0,0.2)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(37,99,235,0.45), 0 2px 6px rgba(0,0,0,0.15)"; }}
                >
                  {/* ── stylesheet for tooltip animation ── */}
                  <style>{`
                    .nav-icon-btn { position:relative; display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; border:none; background:transparent; color:#fff; cursor:pointer; transition:all 0.25s ease; flex-shrink:0; }
                    .nav-icon-btn:hover { transform:translateY(-3px); }
                    .nav-icon-btn.active { background:rgba(255,255,255,0.22); box-shadow:0 0 0 1.5px rgba(255,255,255,0.4) inset; }
                    .nav-tooltip { position:absolute; bottom:calc(100% + 10px); left:50%; transform:translateX(-50%) scale(0.6); opacity:0; background:#0f172a; color:#fff; font-size:11px; font-weight:600; white-space:nowrap; padding:4px 9px; border-radius:7px; pointer-events:none; transition:opacity 0.22s ease, transform 0.22s ease; letter-spacing:0.02em; }
                    .nav-tooltip::after { content:""; position:absolute; top:100%; left:50%; transform:translateX(-50%); border:5px solid transparent; border-top-color:#0f172a; }
                    .nav-icon-btn:hover .nav-tooltip { opacity:1; transform:translateX(-50%) scale(1); }
                  `}</style>

                  {/* Dashboard */}
                  <Link to="/dashboard" className={`nav-icon-btn ${isActive("/dashboard") || isActive("/") ? "active" : ""}`}>
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                    <span className="nav-tooltip">Dashboard</span>
                  </Link>

                  {/* Flujo ISO */}
                  <Link to="/flujo-iso" className={`nav-icon-btn ${isActive("/flujo-iso") ? "active" : ""}`}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <polyline points="17 1 21 5 17 9"/>
                      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                      <polyline points="7 23 3 19 7 15"/>
                      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                    </svg>
                    <span className="nav-tooltip">Flujo ISO</span>
                  </Link>

                  {/* Documentos */}
                  <Link to="/documents" className={`nav-icon-btn ${isActive("/documents") ? "active" : ""}`}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <line x1="10" y1="9" x2="8" y2="9"/>
                    </svg>
                    <span className="nav-tooltip">Documentos</span>
                  </Link>

                  {/* Notificaciones */}
                  <Link to="/notifications" className={`nav-icon-btn ${isActive("/notifications") ? "active" : ""}`} style={{ position: "relative" }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    {unreadCount > 0 && (
                      <span style={{ position:"absolute", top:"3px", right:"3px", minWidth:"16px", height:"16px", fontSize:"9px", fontWeight:700, background:"#ef4444", color:"#fff", borderRadius:"9999px", display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px", border:"1.5px solid #2563eb", lineHeight:1 }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    <span className="nav-tooltip">Notificaciones</span>
                  </Link>

                  {/* Admin-only items */}
                  {(user.role === "ADMIN" || user.role === "QUALITY_MANAGER") && (
                    <>
                      {/* separator */}
                      <span style={{ width:"1px", height:"22px", background:"rgba(255,255,255,0.25)", borderRadius:"2px", margin:"0 3px" }} />

                      {/* Usuarios */}
                      <Link to="/users" className={`nav-icon-btn ${isActive("/users") ? "active" : ""}`}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span className="nav-tooltip">Usuarios</span>
                      </Link>

                      {/* Auditoría */}
                      <Link to="/audit" className={`nav-icon-btn ${isActive("/audit") ? "active" : ""}`}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          <polyline points="9 12 11 14 15 10"/>
                        </svg>
                        <span className="nav-tooltip">Auditoría</span>
                      </Link>

                      {/* Configuración */}
                      <Link to="/config" className={`nav-icon-btn ${isActive("/config") ? "active" : ""}`}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        <span className="nav-tooltip">Configuración</span>
                      </Link>
                    </>
                  )}
                </div>

                {/* ── User profile dropdown ── */}
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

