'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/components/AuthLayout';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setRegistered(true);
    }
    if (searchParams.get('error')) {
      setError(decodeURIComponent(searchParams.get('error') || ''));
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    const clinicSlug = process.env.NEXT_PUBLIC_CLINIC_SLUG;

    if (!clinicSlug) {
      setError('NEXT_PUBLIC_CLINIC_SLUG no está configurado');
      return;
    }
    window.location.href = `/api/auth/google?clinicSlug=${encodeURIComponent(clinicSlug)}`;
  };

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setRegistered(false);
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Error al iniciar sesión'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Accedé a tu cuenta de clínica"
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {registered && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-800">
              Registro exitoso. Por favor iniciá sesión.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              className="ensigna-input !py-3 !px-4 sm:text-sm"
              placeholder="Email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Contraseña
            </label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              className="ensigna-input !py-3 !px-4 sm:text-sm"
              placeholder="Contraseña"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-ensigna-primary !py-3"
        >
          {isLoading ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[var(--ensigna-background)] px-3 text-sm text-[var(--ensigna-text-secondary)]">
              O continuá con
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full btn-ensigna-secondary !justify-center !text-sm"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 2.94.21 4.04.62l3.01-2.94C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continuar con Google
        </button>

        <p className="text-center text-sm text-gray-600">
          ¿No tenés cuenta?{' '}
          <Link
            href="/register"
            className="font-semibold text-red-600 hover:text-red-700"
          >
            Registrate
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
