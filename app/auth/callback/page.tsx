'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function AuthCallbackPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadUserData } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      // Redirigir a login con error
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      // Guardar el token
      apiClient.setToken(token);
      
      // Cargar datos del usuario
      loadUserData().then(() => {
        // Redirigir al dashboard
        router.push('/dashboard');
      }).catch((err) => {
        console.error('Error al cargar datos del usuario:', err);
        router.push('/login?error=Error al cargar datos del usuario');
      });
    } else {
      // No hay token, redirigir a login
      router.push('/login?error=No se recibió token de autenticación');
    }
  }, [searchParams, router, loadUserData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-lg text-gray-600">Procesando autenticación...</div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackPageInner />
    </Suspense>
  );
}
