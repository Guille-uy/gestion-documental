import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { useAuthStore } from "./store/auth.js";

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/documents" element={<DocumentsListPage />} />
                    <Route path="/documents/create" element={<CreateDocumentPage />} />
                    <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route
                      path="/users"
                      element={
                        <ProtectedRoute requiredRoles={["ADMIN", "QUALITY_MANAGER"]}>
                          <UsersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/audit"
                      element={
                        <ProtectedRoute requiredRoles={["ADMIN", "QUALITY_MANAGER"]}>
                          <AuditLogsPage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route
            path="/"
            element={
              isAuthenticated() ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
