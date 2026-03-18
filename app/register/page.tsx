'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';
import AuthLayout from '@/components/AuthLayout';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  phone: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('inviteToken') ?? undefined;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isInviteFlow = !!inviteToken;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isInviteFlow) {
        await apiClient.registerWithInvite({
          inviteToken: inviteToken!,
          email: data.email,
          password: data.password,
          name: data.name,
          lastName: data.lastName,
          phone: data.phone,
        });
      } else {
        await apiClient.register({
          email: data.email,
          password: data.password,
          name: data.name,
          lastName: data.lastName,
          phone: data.phone,
        });
      }
      router.push('/login?registered=true');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Error al registrar usuario';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    const clinicSlug = process.env.NEXT_PUBLIC_CLINIC_SLUG;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
    if (clinicSlug) {
      window.location.href = `${apiUrl}/auth/google?clinicSlug=${clinicSlug}`;
    }
  };

  return (
    <AuthLayout
      title={isInviteFlow ? 'Completar registro como profesional' : 'Crear cuenta'}
      subtitle={
        isInviteFlow
          ? 'Usá el mismo email de la invitación para vincular tu cuenta.'
          : 'Registrate como dueño o profesional de la clínica'
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isInviteFlow && (
          <div className="rounded-xl bg-red-50/80 border border-red-200 p-3">
            <p className="text-xs text-red-800">
              Registro por invitación. El email debe coincidir con el de la
              invitación.
            </p>
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
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm"
              placeholder={
                isInviteFlow ? 'Email (el de la invitación)' : 'Email'
              }
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
              autoComplete="new-password"
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm"
              placeholder="Contraseña (mínimo 8 caracteres)"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Nombre
              </label>
              <input
                {...register('name')}
                type="text"
                autoComplete="given-name"
                className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm"
                placeholder="Nombre"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="sr-only">
                Apellido
              </label>
              <input
                {...register('lastName')}
                type="text"
                autoComplete="family-name"
                className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm"
                placeholder="Apellido"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="sr-only">
              Teléfono (opcional)
            </label>
            <input
              {...register('phone')}
              type="tel"
              autoComplete="tel"
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm"
              placeholder="Teléfono (opcional)"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Registrando…' : 'Registrarse'}
        </button>

        {!isInviteFlow && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm text-gray-500">
                  O continuá con
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
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
          </>
        )}

        <p className="text-center text-sm text-gray-600">
          ¿Ya tenés cuenta?{' '}
          <Link
            href="/login"
            className="font-semibold text-red-600 hover:text-red-700"
          >
            Iniciar sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
