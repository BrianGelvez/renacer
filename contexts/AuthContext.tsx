'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export interface ClinicAvailability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export type RecetarioSyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

interface Clinic {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  prescriptionLogoUrl?: string | null;
  isActive: boolean;
  clinicAvailabilities?: ClinicAvailability[];
  recetarioHealthCenterId?: number | null;
  recetarioSyncStatus?: RecetarioSyncStatus | null;
  recetarioSyncedAt?: string | null;
  recetarioLastError?: string | null;
}

interface AuthContextType {
  user: User | null;
  clinic: Clinic | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Carga los datos del usuario y la clínica desde el backend
   */
  const loadUserData = async () => {
    try {
      const token = apiClient.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Obtener datos del usuario y la clínica en paralelo
      const [userData, clinicData] = await Promise.all([
        apiClient.getMe(),
        apiClient.getCurrentClinic(),
      ]);

      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
      });
      setClinic(clinicData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      apiClient.clearToken();
      setIsAuthenticated(false);
      setUser(null);
      setClinic(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login de usuario
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      
      if (response.accessToken) {
        apiClient.setToken(response.accessToken);
        await loadUserData();
      } else {
        throw new Error('No se recibió token de acceso');
      }
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * Logout de usuario
   */
  const logout = () => {
    apiClient.clearToken();
    setUser(null);
    setClinic(null);
    setIsAuthenticated(false);
  };

  // Cargar datos al montar el componente si hay token
  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        clinic,
        isLoading,
        isAuthenticated,
        login,
        logout,
        loadUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
