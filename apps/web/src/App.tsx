import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/Layout.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { LoginPage } from "./pages/LoginPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { DocumentsListPage } from "./pages/DocumentsListPage.js";
import { CreateDocumentPage } from "./pages/CreateDocumentPage.js";
import { DocumentDetailPage } from "./pages/DocumentDetailPage.js";
import { NotificationsPage } from "./pages/NotificationsPage.js";
import { UsersPage } from "./pages/UsersPage.js";
import { AuditLogsPage } from "./pages/AuditLogsPage.js";
import { ConfigPage } from "./pages/ConfigPage.js";
import { ISOFlowPage } from "./pages/ISOFlowPage.js";
import { ProfilePage } from "./pages/ProfilePage.js";
import { MyTasksPage } from "./pages/MyTasksPage.js";
import { CalendarPage } from "./pages/CalendarPage.js";
import { useAuthStore } from "./store/auth.js";

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  );
}

function AdminLayout() {
  return (
    <ProtectedRoute requiredRoles={["ADMIN", "QUALITY_MANAGER"]}>
      <Outlet />
    </ProtectedRoute>
  );
}

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected layout */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentsListPage />} />
            <Route path="/documents/create" element={<CreateDocumentPage />} />
            <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/flujo-iso" element={<ISOFlowPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/mis-tareas" element={<MyTasksPage />} />
            <Route path="/calendario" element={<CalendarPage />} />

            {/* Admin only */}
            <Route element={<AdminLayout />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/audit" element={<AuditLogsPage />} />
              <Route path="/config" element={<ConfigPage />} />
            </Route>
          </Route>

          {/* Default */}
          <Route
            path="/"
            element={isAuthenticated() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
