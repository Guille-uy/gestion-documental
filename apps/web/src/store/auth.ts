import { create } from "zustand";
import { User } from "@dms/shared";

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  
  // Persisted getters
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  isLoading: false,
  error: null,
  
  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  },
  
  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
  },
  
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
  
  logout: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    });
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
  
  isAuthenticated: () => {
    const state = get();
    return !!state.accessToken && !!state.user;
  },
}));
