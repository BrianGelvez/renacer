'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  QrCode,
  User,
  Stethoscope,
  Building2,
  Pill,
  AlertCircle,
} from 'lucide-react';
import {
  apiClient,
  type MedicalDocumentDetailDto,
} from '@/lib/api';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MedicalDocumentDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<MedicalDocumentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient
      .getMedicalDocument(id)
      .then(setDoc)
      .catch((err: unknown) => {
        setError(
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? 'Documento no encontrado.',
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!doc) return;
    if (doc.pdfUrl) {
      window.open(doc.pdfUrl, '_blank', 'noopener,noreferrer');
    }
    try {
      await apiClient.downloadMedicalDocument(doc.id);
    } catch {
      /* best effort audit */
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-sm text-gray-500">Cargando documento…</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/prescriptions"
          className="inline-flex items-center gap-2 text-sm text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-red-800 text-sm">
          {error ?? 'Documento no encontrado.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/prescriptions"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Documentos
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {doc.documentTypeLabel}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">
            {doc.documentNumber ?? 'Sin número'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {doc.pdfUrl && (
            <>
              <a
                href={doc.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium"
              >
                <FileText className="w-4 h-4" /> Ver PDF
              </a>
              <button
                type="button"
                onClick={() => void handleDownload()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium"
              >
                <Download className="w-4 h-4" /> Descargar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard icon={<User className="w-5 h-5" />} title="Paciente">
          <p className="font-medium">{doc.patientName}</p>
          {doc.patientDni && <p>DNI: {doc.patientDni}</p>}
          {doc.healthInsurance && <p>OS: {doc.healthInsurance}</p>}
          {doc.patientId && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/patients/${doc.patientId}`)}
              className="mt-2 text-indigo-600 text-sm hover:underline"
            >
              Ver ficha del paciente
            </button>
          )}
        </InfoCard>

        <InfoCard icon={<Stethoscope className="w-5 h-5" />} title="Profesional">
          <p className="font-medium">{doc.doctorName || '—'}</p>
          {doc.doctor?.specialty && <p>{doc.doctor.specialty}</p>}
          {doc.doctor?.licenseNumber && (
            <p>Mat. {doc.doctor.licenseNumber}</p>
          )}
        </InfoCard>

        <InfoCard icon={<Building2 className="w-5 h-5" />} title="Institución">
          {doc.institutionName ?? '—'}
        </InfoCard>

        <InfoCard icon={<FileText className="w-5 h-5" />} title="Estado y fechas">
          <p>
            <span className="font-medium">Estado:</span> {doc.statusLabel}
          </p>
          <p>Emisión: {formatDateTime(doc.issuedAt)}</p>
          {doc.expiresAt && (
            <p>Vencimiento: {formatDateTime(doc.expiresAt)}</p>
          )}
        </InfoCard>
      </div>

      {doc.diagnosis && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Diagnóstico</h2>
          <p className="mt-2 text-gray-700">{doc.diagnosis}</p>
        </section>
      )}

      {doc.medicines.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-indigo-600" />
            Medicamentos
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {doc.medicines.map((m, i) => (
              <li key={i} className="rounded-lg bg-gray-50 px-3 py-2">
                {String(m.brand ?? m.name ?? m.drug ?? `Ítem ${i + 1}`)}
                {m.posology ? ` — ${String(m.posology)}` : ''}
                {m.quantity != null ? ` × ${String(m.quantity)}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {doc.indications && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Indicaciones</h2>
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">{doc.indications}</p>
        </section>
      )}

      {doc.qrUrl && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 flex items-center gap-4">
          <QrCode className="w-8 h-8 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">Código QR</p>
            <a
              href={doc.qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline break-all"
            >
              {doc.qrUrl}
            </a>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Próximas acciones
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Renovar', 'Repetir', 'Anular', 'WhatsApp', 'Email'].map((label) => (
            <span
              key={label}
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-400"
            >
              {label} — próximamente
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Arquitectura preparada; pendiente de endpoints Recetario.
        </p>
      </section>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="mt-2 text-sm text-gray-700 space-y-0.5">{children}</div>
    </div>
  );
}
