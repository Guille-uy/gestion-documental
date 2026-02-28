import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.js";
import { apiService } from "../services/api.js";
import toast from "react-hot-toast";

interface LayoutProps {
  children: React.ReactNode;
}

/* ── Nav link hover effect ── */
const NAV_STYLE = `
.nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  color: #4B5563;
  text-decoration: none;
  transition: color 0.18s ease, background 0.18s ease;
  white-space: nowrap;
}
.nav-link::after {
  content: "";
  position: absolute;
  bottom: 3px;
  left: 11px;
  right: 11px;
  height: 2px;
  border-radius: 2px;
  background: #2563eb;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.22s ease;
}
.nav-link:hover {
  color: #1d4ed8;
  background: #EFF6FF;
}
.nav-link:hover::after { transform: scaleX(1); }
.nav-link.active {
  color: #1d4ed8;
  background: #DBEAFE;
  font-weight: 600;
}
.nav-link.active::after { transform: scaleX(1); }
.nav-sep {
  width: 1px;
  height: 20px;
  background: #E5E7EB;
  margin: 0 2px;
  flex-shrink: 0;
}
`;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  QUALITY_MANAGER: "Gestión de Calidad",
  DOCUMENT_OWNER: "Propietario de Documentos",
  REVIEWER: "Revisor",
  APPROVER: "Aprobador",
  READER: "Lector",
};

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // #1 Global search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDrop(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced global search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setShowSearchDrop(false); return; }
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const r = await apiService.listDocuments({ search: searchQuery, limit: 7, page: 1 });
        setSearchResults(r.data.data.items || []);
        setShowSearchDrop(true);
      } catch {} finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close mobile menu on navigation
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Sesion cerrada");
    navigate("/login");
  };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" || location.pathname === "/dashboard" : location.pathname === path;

  const isAdmin = user?.role === "ADMIN" || user?.role === "QUALITY_MANAGER";

  /* ── icon data shared between pill (desktop) and drawer (mobile) ── */
  const navLinks = [
    { to: "/dashboard", label: "Dashboard",
      icon5: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
    { to: "/flujo-iso", label: "Flujo ISO",
      icon5: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg> },
    { to: "/documents", label: "Documentos",
      icon5: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg> },
    { to: "/notifications", label: "Notificaciones", badge: unreadCount,
      icon5: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
  ];

  const adminLinks = [
    { to: "/users", label: "Usuarios",
      icon5: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { to: "/audit", label: "Auditoría",
      icon5: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg> },
    { to: "/config", label: "Configuración",
      icon5: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
  ];

  const allLinks = isAdmin ? [...navLinks, ...adminLinks] : navLinks;

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{NAV_STYLE}</style>

      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <nav className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/logo-centenario.png" alt="Centenario" className="h-9 w-auto" />
              <div className="hidden sm:block leading-tight">
                <div className="text-xs font-bold text-gray-900">Sistema de Gestión</div>
                <div className="text-xs font-bold text-blue-600">Documental</div>
              </div>
            </Link>

            {user && (
              <>
                {/* ── Desktop: text + icon links + profile, all in one flex row ── */}
                <div className="hidden md:flex items-center gap-1">
                  {navLinks.map(({ to, label, badge, icon5 }) => (
                    <Link key={to} to={to} className={`nav-link${isActive(to) ? " active" : ""}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{icon5.props.children}</svg>
                      {label}
                      {badge != null && badge > 0 && (
                        <span className="ml-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                          {badge}
                        </span>
                      )}
                    </Link>
                  ))}

                  {isAdmin && (
                    <>
                      <span className="nav-sep" />
                      {adminLinks.map(({ to, label, icon5 }) => (
                        <Link key={to} to={to} className={`nav-link${isActive(to) ? " active" : ""}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{icon5.props.children}</svg>
                          {label}
                        </Link>
                      ))}
                    </>
                  )}

                  {/* separator before profile */}
                  <span className="nav-sep ml-1" />

                  {/* #1 Global search */}
                  <div className="relative" ref={searchRef}>
                    <div className="relative">
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                      </svg>
                      {isSearching && <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowSearchDrop(true)}
                        onKeyDown={e => e.key === "Escape" && (setSearchQuery(""), setShowSearchDrop(false))}
                        placeholder="Buscar documentos..."
                        className="pl-8 pr-3 py-1.5 w-48 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:w-64 transition-all"
                      />
                    </div>
                    {showSearchDrop && (
                      <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                        {searchResults.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-500">Sin resultados para "{searchQuery}"</p>
                        ) : searchResults.map(doc => (
                          <button key={doc.id} onClick={() => { navigate(`/documents/${doc.id}`); setSearchQuery(""); setShowSearchDrop(false); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{doc.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{doc.code} · {doc.status}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="nav-sep" />

                  {/* ── Profile dropdown ── */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {initials}
                      </span>
                      <div className="hidden md:flex flex-col items-start leading-tight">
                        <span className="max-w-[130px] truncate text-sm font-semibold text-gray-800">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-[10px] font-medium text-blue-600">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-4 flex items-center gap-3">
                          <span className="w-12 h-12 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center shrink-0">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {ROLE_LABELS[user.role] ?? user.role}
                            </span>
                          </div>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/profile"
                            onClick={() => setShowDropdown(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Mi perfil
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                </div>{/* end desktop nav */}

                {/* ── Mobile: notification badge + avatar + hamburger ── */}
                <div className="flex md:hidden items-center gap-2">
                  <Link
                    to="/notifications"
                    className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600"
                    aria-label="Menú"
                  >
                    {showMobileMenu ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* ── Mobile menu panel ── */}
        {user && showMobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
            {/* User info strip */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <span className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <span className="text-[10px] font-semibold text-blue-700">{ROLE_LABELS[user.role] ?? user.role}</span>
              </div>
            </div>

            {/* Nav links */}
            <div className="py-2">
              {allLinks.map(({ to, label, badge, icon5 }: any) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(to)
                      ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                >
                  <span className={isActive(to) ? "text-blue-600" : "text-gray-400"}>
                    <svg width="18" height="18" viewBox="0 0 24 24">{icon5?.props?.children}</svg>
                  </span>
                  {label}
                  {badge != null && badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 p-2">
              <Link
                to="/profile"
                onClick={() => setShowMobileMenu(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-1"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mi perfil
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-8">{children}</main>
    </div>
  );
}

