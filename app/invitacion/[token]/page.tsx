'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const registerSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
    name: z.string().min(1, 'El nombre es requerido'),
    lastName: z.string().min(1, 'El apellido es requerido'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Debés aceptar los términos' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

type Preview = Awaited<ReturnType<typeof apiClient.getInvitationPreview>>;

function InviteAcceptPageInner() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { loadUserData } = useAuth();

  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: undefined },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiClient.getInvitationPreview(token);
        if (!cancelled) {
          setPreview(data);
          if (data.email) {
            registerForm.setValue('email', data.email);
            loginForm.setValue('email', data.email);
          }
        }
      } catch {
        if (!cancelled) setPreview({ status: 'INVALID' });
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, registerForm, loginForm]);

  const finishSession = async (accessToken: string) => {
    apiClient.setToken(accessToken);
    await loadUserData();
    router.push('/dashboard');
  };

  const onRegister = async (data: RegisterFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiClient.registerInvitationAccept(token, {
        email: data.email,
        password: data.password,
        name: data.name,
        lastName: data.lastName,
      });
      await finishSession(result.accessToken);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'No se pudo completar el registro.';
      setError(typeof message === 'string' ? message : 'Error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  const onLogin = async (data: LoginFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const loginResult = await apiClient.login(data);
      if (!loginResult.accessToken) {
        throw new Error('No se pudo iniciar sesión.');
      }
      apiClient.setToken(loginResult.accessToken);
      const acceptResult = await apiClient.acceptInvitation(token);
      await finishSession(acceptResult.accessToken);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'No se pudo aceptar la invitación.';
      setError(typeof message === 'string' ? message : 'Error inesperado.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPreview) {
    return (
      <AuthLayout title="Cargando invitación…">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-ensigna-primary" />
        </div>
      </AuthLayout>
    );
  }

  if (!preview || preview.status === 'INVALID') {
    return (
      <AuthLayout title="Invitación no válida">
        <div className="flex flex-col items-center gap-4 text-center py-6">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-gray-600">Este enlace de invitación no es válido.</p>
          <Link href="/login" className="text-ensigna-primary font-medium hover:underline">
            Ir al inicio de sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (preview.status === 'EXPIRED') {
    return (
      <AuthLayout title="Invitación expirada">
        <div className="flex flex-col items-center gap-4 text-center py-6">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <p className="text-gray-600">La invitación expiró.</p>
          <p className="text-sm text-gray-500">
            Pedile a quien te invitó que envíe una nueva invitación.
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (preview.status === 'ACCEPTED') {
    return (
      <AuthLayout title="Invitación utilizada">
        <div className="flex flex-col items-center gap-4 text-center py-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          <p className="text-gray-600">Esta invitación ya fue utilizada.</p>
          <Link href="/login" className="text-ensigna-primary font-medium hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (preview.status === 'CANCELLED') {
    return (
      <AuthLayout title="Invitación cancelada">
        <div className="flex flex-col items-center gap-4 text-center py-6">
          <AlertCircle className="w-12 h-12 text-gray-400" />
          <p className="text-gray-600">Esta invitación fue cancelada.</p>
        </div>
      </AuthLayout>
    );
  }

  const roleLabel = preview.role === 'ADMIN' ? 'Administrador' : 'Médico';

  return (
    <AuthLayout
      title="Aceptar invitación"
      subtitle={`${preview.clinicName} · ${roleLabel}`}
    >
      <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
        {preview.inviterName ? (
          <p>
            <strong>{preview.inviterName}</strong> te invitó a unirte como{' '}
            <strong>{roleLabel.toLowerCase()}</strong>.
          </p>
        ) : (
          <p>
            Fuiste invitado a unirte como <strong>{roleLabel.toLowerCase()}</strong>.
          </p>
        )}
        <p className="mt-2 text-emerald-700">La invitación expira en 48 horas.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {preview.requiresRegistration ? (
        <form className="space-y-4" onSubmit={registerForm.handleSubmit(onRegister)}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              readOnly
              {...registerForm.register('email')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                {...registerForm.register('name')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
              />
              {registerForm.formState.errors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido
              </label>
              <input
                {...registerForm.register('lastName')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
              />
              {registerForm.formState.errors.lastName && (
                <p className="text-xs text-red-600 mt-1">
                  {registerForm.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              {...registerForm.register('password')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
            />
            {registerForm.formState.errors.password && (
              <p className="text-xs text-red-600 mt-1">
                {registerForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              type="password"
              {...registerForm.register('confirmPassword')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
            />
            {registerForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">
                {registerForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <label className="flex items-start gap-3 text-sm text-gray-600">
            <input
              type="checkbox"
              {...registerForm.register('acceptTerms')}
              className="mt-1"
            />
            <span>Acepto los términos y condiciones del servicio</span>
          </label>
          {registerForm.formState.errors.acceptTerms && (
            <p className="text-xs text-red-600">
              {registerForm.formState.errors.acceptTerms.message}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-ensigna-primary text-white font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creando cuenta…
              </>
            ) : (
              'Crear cuenta y unirme'
            )}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={loginForm.handleSubmit(onLogin)}>
          <p className="text-sm text-gray-600">
            Ya tenés una cuenta con este email. Iniciá sesión para aceptar la
            invitación automáticamente.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              readOnly
              {...loginForm.register('email')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              {...loginForm.register('password')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
            />
            {loginForm.formState.errors.password && (
              <p className="text-xs text-red-600 mt-1">
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-ensigna-primary text-white font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ingresando…
              </>
            ) : (
              'Iniciar sesión y aceptar'
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Cargando…">
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-ensigna-primary" />
          </div>
        </AuthLayout>
      }
    >
      <InviteAcceptPageInner />
    </Suspense>
  );
}
