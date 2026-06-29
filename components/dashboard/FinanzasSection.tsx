'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
  Loader2,
  RefreshCw,
  Building2,
  FileCheck,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import RegisterPaymentModal from './RegisterPaymentModal';
import MobileDataCard from '@/components/ui/MobileDataCard';

type PaymentRow = {
  id: string;
  createdAt: string;
  amount: number;
  patientPaidAmount?: number;
  insuranceAmount?: number;
  healthInsuranceId?: string | null;
  insuranceBillingStatus?: 'PENDING' | 'INVOICED' | 'COLLECTED' | null;
  method: string;
  source: string;
  status: string;
  patient: { id: string; firstName: string; lastName: string };
  healthInsurance?: { id: string; name: string } | null;
  appointment?: {
    id: string;
    startTime: string;
    doctor?: { id: string; name: string; lastName: string } | null;
  } | null;
  insuranceClaim?: { id: string; status: string } | null;
};

type DoctorPickerOpt = { id: string; firstName: string; lastName: string };
type HiOpt = { id: string; name: string };

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  OTHER: 'Otro',
};

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

function formatTurno(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

function patientPaidDisplay(p: PaymentRow): number {
  const pp = p.patientPaidAmount ?? 0;
  const ins = p.insuranceAmount ?? 0;
  const hasSplit =
    pp > 0 || ins > 0 || (p.healthInsuranceId != null && p.healthInsuranceId.length > 0);
  if (hasSplit) return pp;
  if (p.status === 'PAID' && p.source === 'PRIVATE') return p.amount;
  return 0;
}

function insuranceDisplay(p: PaymentRow): number {
  const ins = p.insuranceAmount ?? 0;
  if (ins > 0) return ins;
  if (p.status === 'PENDING' && p.source === 'INSURANCE' && p.insuranceClaim) {
    return p.amount;
  }
  return 0;
}

function rowStateBadge(p: PaymentRow): { label: string; className: string } {
  if (p.status === 'CANCELED') {
    return { label: 'Anulado', className: 'bg-red-100 text-red-800 border-red-200' };
  }
  if (p.status === 'PENDING' && p.source === 'INSURANCE') {
    return {
      label: 'Pendiente OS (liquidación)',
      className: 'bg-amber-100 text-amber-900 border-amber-200',
    };
  }
  if (p.insuranceBillingStatus === 'COLLECTED') {
    return { label: 'OS cobrada', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  }
  if (p.insuranceBillingStatus === 'INVOICED') {
    return { label: 'OS facturada', className: 'bg-sky-100 text-sky-900 border-sky-200' };
  }
  if (p.insuranceBillingStatus === 'PENDING') {
    return { label: 'Pendiente OS', className: 'bg-amber-50 text-amber-900 border-amber-200' };
  }
  if (p.status === 'PAID') {
    return { label: 'Pagado', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  }
  return { label: p.status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
}

export default function FinanzasSection() {
  const { user } = useAuth();
  const canManageStatus = user?.role === 'OWNER' || user?.role === 'ADMIN';

  const [summary, setSummary] = useState<{
    todayPatientIncome: number;
    totalPatientIncome: number;
    pendingInsurance: number;
    invoicedInsurance: number;
    collectedInsurance: number;
    todayIncome: number;
    totalIncome: number;
    pendingIncome: number;
    byMethod: { CASH: number; CARD: number; TRANSFER: number; OTHER: number };
    bySource: { PRIVATE: number; INSURANCE: number };
  } | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [doctorFilterOpts, setDoctorFilterOpts] = useState<DoctorPickerOpt[]>([]);
  const [healthInsurances, setHealthInsurances] = useState<HiOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionId, setActionId] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterDoctorUserId, setFilterDoctorUserId] = useState('');
  const [filterHealthInsuranceId, setFilterHealthInsuranceId] = useState('');
  const [filterBilling, setFilterBilling] = useState('');

  const [exportOsId, setExportOsId] = useState('');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportMarkInvoiced, setExportMarkInvoiced] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    try {
      const [docs, his] = await Promise.all([
        apiClient.listClinicDoctors(),
        apiClient.getHealthInsurances(true),
      ]);
      const dList = Array.isArray(docs) ? docs : [];
      setDoctorFilterOpts(
        dList.map((x: { userId: string; firstName: string; lastName: string }) => ({
          id: x.userId,
          firstName: x.firstName,
          lastName: x.lastName,
        })),
      );
      const hList = Array.isArray(his) ? his : [];
      setHealthInsurances(
        hList.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })),
      );
    } catch {
      setDoctorFilterOpts([]);
      setHealthInsurances([]);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, list] = await Promise.all([
        apiClient.getPaymentsSummary(),
        apiClient.getPayments({
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          status: filterStatus || undefined,
          source: filterSource || undefined,
          doctorUserId: filterDoctorUserId || undefined,
          healthInsuranceId: filterHealthInsuranceId || undefined,
          insuranceBillingStatus:
            (filterBilling as 'PENDING' | 'INVOICED' | 'COLLECTED') || undefined,
        }),
      ]);
      setSummary(s);
      setPayments(Array.isArray(list) ? list : []);
    } catch {
      setSummary(null);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [
    fromDate,
    toDate,
    filterStatus,
    filterSource,
    filterDoctorUserId,
    filterHealthInsuranceId,
    filterBilling,
    refreshKey,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePatchStatus = async (id: string, status: 'PAID' | 'CANCELED') => {
    setActionId(id);
    try {
      await apiClient.patchPaymentStatus(id, { status });
      setRefreshKey((k) => k + 1);
    } finally {
      setActionId(null);
    }
  };

  const handlePatchBilling = async (id: string, action: 'INVOICED' | 'COLLECTED') => {
    setActionId(id);
    try {
      await apiClient.patchPaymentInsuranceBilling(id, { action });
      setRefreshKey((k) => k + 1);
    } finally {
      setActionId(null);
    }
  };

  const handleExportLiquidacion = async () => {
    if (!exportOsId) {
      setExportError('Seleccioná una obra social.');
      return;
    }
    if ((exportFrom && !exportTo) || (!exportFrom && exportTo)) {
      setExportError('Indicá fecha desde y hasta, o dejá ambas vacías.');
      return;
    }
    setExportLoading(true);
    setExportError(null);
    try {
      await apiClient.downloadLiquidacionObraSocialExcel(exportOsId, {
        from: exportFrom || undefined,
        to: exportTo || undefined,
        markInvoiced: exportMarkInvoiced,
      });
      setRefreshKey((k) => k + 1);
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : 'Error al exportar.');
    } finally {
      setExportLoading(false);
    }
  };

  const pendingHigh = summary && summary.pendingInsurance >= 100000;

  const colCount = canManageStatus ? 9 : 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-8 h-8 text-amber-600" />
            Finanzas
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Ingresos del paciente, deuda y cobro de obra social, con trazabilidad por turno.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => setRegisterOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
          >
            <Plus className="w-4 h-4" />
            Registrar pago
          </button>
        </div>
      </div>

      {pendingHigh && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Pendiente de obra social elevado</p>
            <p className="text-amber-900/90 mt-0.5">
              Hay {formatMoney(summary!.pendingInsurance)} pendientes de facturar/cobrar a obras
              sociales (incluye liquidaciones clásicas). Revisá la tabla y actualizá estados.
            </p>
          </div>
        </div>
      )}

      {loading && !summary ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="ensigna-glass p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
              <TrendingUp className="w-4 h-4" />
              Hoy · Paciente
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {formatMoney(summary.todayPatientIncome ?? summary.todayIncome)}
            </p>
          </div>
          <div className="ensigna-glass p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
              <Wallet className="w-4 h-4" />
              Total · Ingresos paciente
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {formatMoney(summary.totalPatientIncome ?? summary.totalIncome)}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-medium">
              <Clock className="w-4 h-4" />
              Pendiente OS
            </div>
            <p className="text-xl font-bold text-amber-900 mt-1">
              {formatMoney(summary.pendingInsurance)}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sky-800 text-xs font-medium">
              <FileCheck className="w-4 h-4" />
              Facturado OS
            </div>
            <p className="text-xl font-bold text-sky-900 mt-1">
              {formatMoney(summary.invoicedInsurance)}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Cobrado OS
            </div>
            <p className="text-xl font-bold text-emerald-900 mt-1">
              {formatMoney(summary.collectedInsurance)}
            </p>
          </div>
          <div className="ensigna-glass p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
              <Building2 className="w-4 h-4" />
              Método (cobrado)
            </div>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Ef. {formatMoney(summary.byMethod.CASH)} · Tr.{' '}
              {formatMoney(summary.byMethod.TRANSFER)}
            </p>
          </div>
        </div>
      ) : null}

      {canManageStatus && (
        <div className="ensigna-glass p-4 sm:p-6 bg-emerald-50/50 border-emerald-200/40 shadow-[0_8px_30px_rgba(16,124,65,0.08)]">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-emerald-950 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#107C41]" />
                Exportar liquidación (Excel)
              </h2>
              <p className="text-sm text-emerald-900/70 mt-1">
                Incluye solo pagos con monto de obra social en estado{' '}
                <strong className="text-emerald-900">pendiente</strong>. Por defecto, al descargar se marcan como{' '}
                <strong className="text-emerald-900">facturados</strong> (podés desactivarlo para solo generar el archivo).
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 items-end">
            <label className="text-xs text-emerald-900/80 flex flex-col gap-1 min-w-[200px]">
              Obra social
              <select
                value={exportOsId}
                onChange={(e) => setExportOsId(e.target.value)}
                className="rounded-lg border border-emerald-200/80 bg-white/90 px-2 py-2 text-sm text-emerald-950 focus:border-[#107C41] focus:outline-none focus:ring-2 focus:ring-[#107C41]/25"
              >
                <option value="">Seleccionar…</option>
                {healthInsurances.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-emerald-900/80 flex flex-col gap-1">
              Desde (opcional)
              <input
                type="date"
                value={exportFrom}
                onChange={(e) => setExportFrom(e.target.value)}
                className="rounded-lg border border-emerald-200/80 bg-white/90 px-2 py-1.5 text-sm text-emerald-950 focus:border-[#107C41] focus:outline-none focus:ring-2 focus:ring-[#107C41]/25"
              />
            </label>
            <label className="text-xs text-emerald-900/80 flex flex-col gap-1">
              Hasta (opcional)
              <input
                type="date"
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
                className="rounded-lg border border-emerald-200/80 bg-white/90 px-2 py-1.5 text-sm text-emerald-950 focus:border-[#107C41] focus:outline-none focus:ring-2 focus:ring-[#107C41]/25"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-emerald-900 cursor-pointer pb-1">
              <input
                type="checkbox"
                checked={exportMarkInvoiced}
                onChange={(e) => setExportMarkInvoiced(e.target.checked)}
                className="rounded border-emerald-400 text-[#107C41] focus:ring-[#107C41]/30"
              />
              Marcar como facturado al exportar
            </label>
            <button
              type="button"
              disabled={exportLoading}
              onClick={() => void handleExportLiquidacion()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#107C41] to-[#185C37] text-white text-sm font-medium shadow-md shadow-emerald-900/20 hover:brightness-110 active:brightness-95 disabled:opacity-50 transition-all"
            >
              {exportLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Exportar liquidación
            </button>
          </div>
          {exportError && (
            <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {exportError}
            </p>
          )}
        </div>
      )}

      <div className="ensigna-glass overflow-hidden p-0">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Movimientos</h2>
          <div className="flex flex-wrap gap-2 items-end">
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Desde
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Hasta
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Estado pago
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm min-w-[130px]"
              >
                <option value="">Todos</option>
                <option value="PAID">Cobrado</option>
                <option value="PENDING">Pendiente</option>
                <option value="CANCELED">Anulado</option>
              </select>
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Origen
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm min-w-[130px]"
              >
                <option value="">Todos</option>
                <option value="PRIVATE">Particular</option>
                <option value="INSURANCE">Obra social</option>
              </select>
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Médico
              <select
                value={filterDoctorUserId}
                onChange={(e) => setFilterDoctorUserId(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm min-w-[160px]"
              >
                <option value="">Todos</option>
                {doctorFilterOpts.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.firstName} {pr.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Obra social
              <select
                value={filterHealthInsuranceId}
                onChange={(e) => setFilterHealthInsuranceId(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm min-w-[160px]"
              >
                <option value="">Todas</option>
                {healthInsurances.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Estado OS
              <select
                value={filterBilling}
                onChange={(e) => setFilterBilling(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm min-w-[140px]"
              >
                <option value="">Todos</option>
                <option value="PENDING">Pendiente</option>
                <option value="INVOICED">Facturado</option>
                <option value="COLLECTED">Cobrado</option>
              </select>
            </label>
          </div>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No hay pagos con los filtros seleccionados.
            </p>
          ) : (
            payments.map((p) => {
              const badge = rowStateBadge(p);
              const pp = patientPaidDisplay(p);
              const ins = insuranceDisplay(p);
              const docRow = p.appointment?.doctor;
              return (
                <MobileDataCard
                  key={p.id}
                  title={`${p.patient.firstName} ${p.patient.lastName}`}
                  subtitle={formatDateTime(p.createdAt)}
                  badge={
                    <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  }
                  fields={[
                    { label: 'Total', value: formatMoney(p.amount) },
                    { label: 'Paciente', value: formatMoney(pp) },
                    { label: 'Obra social', value: p.healthInsurance?.name ?? '—' },
                    {
                      label: 'Turno',
                      value: docRow
                        ? `${docRow.lastName}, ${docRow.name}`
                        : formatTurno(p.appointment?.startTime),
                    },
                    { label: 'Método', value: METHOD_LABELS[p.method] ?? p.method },
                    { label: 'OS pendiente', value: formatMoney(ins) },
                  ]}
                  actions={
                    canManageStatus ? (
                      <>
                        {p.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              disabled={actionId === p.id}
                              onClick={() => handlePatchStatus(p.id, 'PAID')}
                              className="touch-target inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                            >
                              Cobrado
                            </button>
                            <button
                              type="button"
                              disabled={actionId === p.id}
                              onClick={() => handlePatchStatus(p.id, 'CANCELED')}
                              className="touch-target inline-flex flex-1 items-center justify-center rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 disabled:opacity-50"
                            >
                              Anular
                            </button>
                          </>
                        )}
                      </>
                    ) : undefined
                  }
                />
              );
            })
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-3 py-3 font-medium whitespace-nowrap">Fecha</th>
                <th className="px-3 py-3 font-medium">Paciente</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Turno</th>
                <th className="px-3 py-3 font-medium text-right whitespace-nowrap">Total</th>
                <th className="px-3 py-3 font-medium text-right whitespace-nowrap">Paciente</th>
                <th className="px-3 py-3 font-medium text-right whitespace-nowrap">OS</th>
                <th className="px-3 py-3 font-medium">OS / Estado</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Método</th>
                {canManageStatus && (
                  <th className="px-3 py-3 font-medium text-right whitespace-nowrap">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin inline text-amber-500" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-gray-500">
                    No hay pagos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const badge = rowStateBadge(p);
                  const pp = patientPaidDisplay(p);
                  const ins = insuranceDisplay(p);
                  const docRow = p.appointment?.doctor;
                  return (
                    <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50/80">
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                        {formatDateTime(p.createdAt)}
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900">
                        {p.patient.firstName} {p.patient.lastName}
                      </td>
                      <td className="px-3 py-3 text-gray-600 text-xs max-w-[140px] truncate">
                        {docRow
                          ? `${docRow.lastName}, ${docRow.name} · ${formatTurno(p.appointment?.startTime)}`
                          : formatTurno(p.appointment?.startTime)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-900">
                        {formatMoney(p.amount)}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-800">
                        {formatMoney(pp)}
                      </td>
                      <td className="px-3 py-3 text-right text-amber-900 font-medium">
                        {formatMoney(ins)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          {p.healthInsurance?.name && (
                            <span className="text-xs text-gray-600">{p.healthInsurance.name}</span>
                          )}
                          <span
                            className={`inline-flex w-fit px-2 py-0.5 rounded-lg text-xs font-medium border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                        {METHOD_LABELS[p.method] ?? p.method}
                      </td>
                      {canManageStatus && (
                        <td className="px-3 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            {p.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  disabled={actionId === p.id}
                                  onClick={() => handlePatchStatus(p.id, 'PAID')}
                                  className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  Cobrado
                                </button>
                                <button
                                  type="button"
                                  disabled={actionId === p.id}
                                  onClick={() => handlePatchStatus(p.id, 'CANCELED')}
                                  className="px-2 py-1 rounded-lg text-xs font-medium border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Anular
                                </button>
                              </>
                            )}
                            {p.insuranceBillingStatus === 'PENDING' && (
                              <button
                                type="button"
                                disabled={actionId === p.id}
                                onClick={() => handlePatchBilling(p.id, 'INVOICED')}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                              >
                                Facturado
                              </button>
                            )}
                            {p.insuranceBillingStatus === 'INVOICED' && (
                              <button
                                type="button"
                                disabled={actionId === p.id}
                                onClick={() => handlePatchBilling(p.id, 'COLLECTED')}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
                              >
                                Cobrado OS
                              </button>
                            )}
                            {p.status === 'PAID' &&
                              p.source === 'INSURANCE' &&
                              !p.insuranceBillingStatus && (
                                <button
                                  type="button"
                                  disabled={actionId === p.id}
                                  onClick={() => handlePatchStatus(p.id, 'CANCELED')}
                                  className="px-2 py-1 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                                >
                                  Anular
                                </button>
                              )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RegisterPaymentModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
        defaultPatientId={null}
        allowPatientChange
      />
    </motion.div>
  );
}
