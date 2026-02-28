import axios, { AxiosInstance } from "axios";
import { useAuthStore } from "../store/auth.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    // Handle token refresh on 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const { refreshToken } = useAuthStore.getState();

          if (refreshToken) {
            try {
              const response = await this.client.post("/auth/refresh", {
                refreshToken,
              });
              const { accessToken } = response.data.data;
              useAuthStore.setState({ accessToken });
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            } catch (refreshError) {
              useAuthStore.getState().logout();
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth API
  login(email: string, password: string) {
    return this.client.post("/auth/login", { email, password });
  }

  me() {
    return this.client.get("/auth/me");
  }

  // Users API
  createUser(data: any) {
    return this.client.post("/auth/users", data);
  }

  getUsers(page = 1, limit = 20, includeInactive = false) {
    return this.client.get("/auth/users", { params: { page, limit, includeInactive } });
  }

  getUser(id: string) {
    return this.client.get(`/auth/users/${id}`);
  }

  updateUser(id: string, data: any) {
    return this.client.patch(`/auth/users/${id}`, data);
  }

  deleteUser(id: string) {
    return this.client.delete(`/auth/users/${id}`);
  }

  reactivateUser(id: string) {
    return this.client.patch(`/auth/users/${id}/reactivate`);
  }

  // Documents API
  createDocument(data: any) {
    return this.client.post("/documents", data);
  }

  listDocuments(params: any = {}) {
    return this.client.get("/documents", { params });
  }

  getDocument(documentId: string) {
    return this.client.get(`/documents/${documentId}`);
  }

  updateDocument(documentId: string, data: any) {
    return this.client.patch(`/documents/${documentId}`, data);
  }

  uploadFile(documentId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return this.client.post(`/documents/${documentId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  submitForReview(documentId: string, data: any) {
    return this.client.post(`/documents/${documentId}/submit-review`, data);
  }

  approveReview(documentId: string, reviewTaskId: string, data: any) {
    return this.client.post(
      `/documents/${documentId}/reviews/${reviewTaskId}/approve`,
      data
    );
  }

  publishDocument(documentId: string, data: any = {}) {
    return this.client.post(`/documents/${documentId}/publish`, data);
  }

  createNewVersion(documentId: string, data: { changes?: string } = {}) {
    return this.client.post(`/documents/${documentId}/new-version`, data);
  }

  downloadDocument(documentId: string) {
    return this.client.get(`/documents/${documentId}/download`, {
      responseType: "blob",
    });
  }

  // Config API (Areas and Document Types)
  getAreas(includeInactive = false) {
    return this.client.get("/config/areas", { params: { includeInactive } });
  }

  createArea(data: { name: string; code: string; description?: string }) {
    return this.client.post("/config/areas", data);
  }

  updateArea(id: string, data: any) {
    return this.client.patch(`/config/areas/${id}`, data);
  }

  deleteArea(id: string) {
    return this.client.delete(`/config/areas/${id}`);
  }

  getDocumentTypes(includeInactive = false) {
    return this.client.get("/config/document-types", { params: { includeInactive } });
  }

  createDocumentType(data: { name: string; code: string; prefix: string; description?: string }) {
    return this.client.post("/config/document-types", data);
  }

  updateDocumentType(id: string, data: any) {
    return this.client.patch(`/config/document-types/${id}`, data);
  }

  deleteDocumentType(id: string) {
    return this.client.delete(`/config/document-types/${id}`);
  }

  // Notifications API
  getNotifications(params: any = {}) {
    return this.client.get("/notifications", { params });
  }

  markNotificationAsRead(notificationId: string) {
    return this.client.patch(`/notifications/${notificationId}/read`);
  }

  markAllNotificationsAsRead() {
    return this.client.post("/notifications/mark-all-read");
  }

  getUnreadCount() {
    return this.client.get("/notifications/unread/count");
  }

  deleteNotification(notificationId: string) {
    return this.client.delete(`/notifications/${notificationId}`);
  }

  archiveNotification(notificationId: string) {
    return this.client.patch(`/notifications/${notificationId}/archive`);
  }

  restoreNotification(notificationId: string) {
    return this.client.patch(`/notifications/${notificationId}/restore`);
  }

  // Audit API
  getAuditLogs(params: any = {}) {
    return this.client.get("/audit", { params });
  }

  // #12 — Read confirmations
  confirmDocumentRead(documentId: string) {
    return this.client.post(`/documents/${documentId}/confirm-read`);
  }

  getDocumentReadConfirmations(documentId: string) {
    return this.client.get(`/documents/${documentId}/confirmations`);
  }
}

export const apiService = new ApiService();
