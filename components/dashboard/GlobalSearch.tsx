'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ClipboardList,
  FileText,
  Loader2,
  MessageCircle,
  Pill,
  Search,
  Stethoscope,
  User,
  Users,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { PermissionModule } from '@/lib/permissions';

type SearchGroup = 'Pacientes' | 'Recetas' | 'Ordenes' | 'Conversaciones' | 'Medicos' | 'Acciones';

type GlobalSearchResult = {
  id: string;
  group: SearchGroup;
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ReactNode;
};

type QuickShortcut = {
  id: string;
  label: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  permission: PermissionModule;
};

type GlobalSearchProps = {
  canAccess: (permission: PermissionModule) => boolean;
  compact?: boolean;
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

function includes(value: unknown, query: string): boolean {
  return String(value ?? '').toLowerCase().includes(query.toLowerCase());
}

function groupOrder(group: SearchGroup): number {
  return ['Acciones', 'Pacientes', 'Recetas', 'Ordenes', 'Conversaciones', 'Medicos'].indexOf(group);
}

export default function GlobalSearch({ canAccess, compact = false }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const searchableModules = useMemo(
    () => ({
      patients: canAccess('patients'),
      prescriptions: canAccess('prescriptions'),
      orders: canAccess('orders'),
      conversations: canAccess('conversations'),
      doctors: canAccess('team') || canAccess('schedule'),
    }),
    [canAccess],
  );

  const shortcuts = useMemo(
    () =>
      (
        [
          searchableModules.patients && {
            id: 'patients',
            label: 'Ver pacientes',
            subtitle: 'Listado completo con filtros',
            href: '/dashboard/patients',
            icon: <Users className="h-4 w-4" />,
            permission: 'patients' as PermissionModule,
          },
          searchableModules.prescriptions && {
            id: 'new-rx',
            label: 'Nueva receta',
            subtitle: 'Emitir receta en menos pasos',
            href: '/dashboard/prescriptions/new',
            icon: <Pill className="h-4 w-4" />,
            permission: 'prescriptions' as PermissionModule,
          },
          searchableModules.orders && {
            id: 'new-order',
            label: 'Nueva orden',
            subtitle: 'Solicitudes, plantillas y diagnóstico',
            href: '/dashboard/orders/new',
            icon: <ClipboardList className="h-4 w-4" />,
            permission: 'orders' as PermissionModule,
          },
          canAccess('schedule') && {
            id: 'agenda',
            label: 'Agenda del día',
            subtitle: 'Turnos de hoy',
            href: '/dashboard/agenda?filter=hoy',
            icon: <Calendar className="h-4 w-4" />,
            permission: 'schedule' as PermissionModule,
          },
          searchableModules.conversations && {
            id: 'conversations',
            label: 'Conversaciones',
            subtitle: 'Mensajes con pacientes',
            href: '/dashboard/conversaciones',
            icon: <MessageCircle className="h-4 w-4" />,
            permission: 'conversations' as PermissionModule,
          },
        ] as Array<QuickShortcut | false>
      ).filter(Boolean) as QuickShortcut[],
    [canAccess, searchableModules],
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setActiveIndex(0);
  }, []);

  const openSearch = useCallback(() => {
    setOpen(true);
    setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch();
      }
      if (event.key === 'Escape') {
        close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, openSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery, results.length, shortcuts.length]);

  useEffect(() => {
    let cancelled = false;

    async function runSearch() {
      if (debouncedQuery.length < MIN_QUERY_LENGTH) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const next: GlobalSearchResult[] = [];

      const tasks: Array<Promise<void>> = [];

      if (searchableModules.patients) {
        tasks.push(
          apiClient
            .getPatients({ q: debouncedQuery, page: 1, limit: 6, activeFilter: 'all' })
            .then((res) => {
              const items = (res as { items?: Array<any> }).items ?? [];
              items.forEach((patient) => {
                next.push({
                  id: `patient-${patient.id}`,
                  group: 'Pacientes',
                  title: `${patient.lastName}, ${patient.firstName}`,
                  subtitle: [patient.dni ? `DNI ${patient.dni}` : null, patient.phone, patient.email]
                    .filter(Boolean)
                    .join(' - '),
                  href: `/dashboard/patients/${patient.id}`,
                  icon: <User className="h-4 w-4" />,
                });
              });
            })
            .catch(() => undefined),
        );
      }

      if (searchableModules.prescriptions) {
        tasks.push(
          apiClient
            .listMedicalDocuments({ q: debouncedQuery, page: 1, limit: 6 })
            .then((res) => {
              res.items.forEach((doc) => {
                next.push({
                  id: `doc-${doc.id}`,
                  group: doc.documentType === 'PRESCRIPTION' ? 'Recetas' : 'Ordenes',
                  title: doc.patientName || doc.documentTypeLabel,
                  subtitle: [
                    doc.documentTypeLabel,
                    doc.doctorName,
                    doc.documentNumber ? `Nro ${doc.documentNumber}` : null,
                  ]
                    .filter(Boolean)
                    .join(' - '),
                  href: `/dashboard/prescriptions/${doc.id}`,
                  icon:
                    doc.documentType === 'PRESCRIPTION' ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <ClipboardList className="h-4 w-4" />
                    ),
                });
              });
            })
            .catch(() => undefined),
        );
      }

      if (searchableModules.orders) {
        tasks.push(
          apiClient
            .listMedicalOrders({ page: 1, limit: 20 })
            .then((res) => {
              res.items
                .filter((order) =>
                  [
                    order.patient?.firstName,
                    order.patient?.lastName,
                    order.patient?.dni,
                    order.doctor?.firstName,
                    order.doctor?.lastName,
                    order.diagnosisDescription,
                    order.recetarioOrderId,
                  ].some((value) => includes(value, debouncedQuery)),
                )
                .slice(0, 5)
                .forEach((order) => {
                  next.push({
                    id: `order-${order.id}`,
                    group: 'Ordenes',
                    title: order.patient
                      ? `${order.patient.lastName}, ${order.patient.firstName}`
                      : 'Orden medica',
                    subtitle: [order.diagnosisDescription, order.status].filter(Boolean).join(' - '),
                    href: `/dashboard/orders/${order.id}`,
                    icon: <ClipboardList className="h-4 w-4" />,
                  });
                });
            })
            .catch(() => undefined),
        );
      }

      if (searchableModules.conversations) {
        tasks.push(
          apiClient
            .getMessageConversations()
            .then((conversations) => {
              conversations
                .filter((conversation) =>
                  [conversation.externalId, conversation.patientDni, conversation.channel].some((value) =>
                    includes(value, debouncedQuery),
                  ),
                )
                .slice(0, 5)
                .forEach((conversation) => {
                  next.push({
                    id: `conversation-${conversation.id}`,
                    group: 'Conversaciones',
                    title: conversation.patientDni
                      ? `DNI ${conversation.patientDni}`
                      : conversation.externalId,
                    subtitle: `${conversation.channel} - ${conversation._count.messages} mensajes`,
                    href: `/dashboard/conversaciones?conversationId=${conversation.id}`,
                    icon: <MessageCircle className="h-4 w-4" />,
                  });
                });
            })
            .catch(() => undefined),
        );
      }

      if (searchableModules.doctors) {
        tasks.push(
          apiClient
            .getTeamMembers()
            .then((team) => {
              team
                .filter((member) => member.isDoctor)
                .filter((member) =>
                  [member.firstName, member.lastName, member.email, member.specialty, member.licenseNumber].some(
                    (value) => includes(value, debouncedQuery),
                  ),
                )
                .slice(0, 5)
                .forEach((member) => {
                  next.push({
                    id: `doctor-${member.userId}`,
                    group: 'Medicos',
                    title: `Dr/a. ${member.firstName} ${member.lastName}`,
                    subtitle: [member.specialty, member.licenseNumber ? `Mat. ${member.licenseNumber}` : null]
                      .filter(Boolean)
                      .join(' - '),
                    href: `/dashboard?section=team&doctorId=${member.userId}`,
                    icon: <Stethoscope className="h-4 w-4" />,
                  });
                });
            })
            .catch(() => undefined),
        );
      }

      await Promise.all(tasks);
      if (cancelled) return;

      setResults(
        next
          .sort((a, b) => groupOrder(a.group) - groupOrder(b.group) || a.title.localeCompare(b.title))
          .slice(0, 18),
      );
      setLoading(false);
    }

    void runSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, searchableModules]);

  const goToResult = (href: string) => {
    close();
    router.push(href);
  };

  const flatResults: GlobalSearchResult[] = useMemo(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      return shortcuts.map((item) => ({
        id: item.id,
        group: 'Acciones' as const,
        title: item.label,
        subtitle: item.subtitle,
        href: item.href,
        icon: item.icon,
      }));
    }
    return results;
  }, [debouncedQuery, results, shortcuts]);

  const groupedResults = flatResults.reduce<
    Record<string, GlobalSearchResult[]>
  >((acc, item) => {
    acc[item.group] = acc[item.group] ? [...acc[item.group], item] : [item];
    return acc;
  }, {});

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter' && flatResults[activeIndex]) {
      event.preventDefault();
      goToResult(flatResults[activeIndex].href);
    }
  };

  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  let resultIndex = -1;

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className={
          compact
            ? 'touch-target relative inline-flex items-center justify-center rounded-xl text-[var(--ensigna-text-secondary)] transition-colors hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ensigna-primary'
            : 'group inline-flex w-72 items-center justify-between gap-3 rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-sm text-white/80 transition-all hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70'
        }
        aria-label="Abrir buscador global"
      >
        {compact ? (
          <Search className="h-5 w-5" />
        ) : (
          <>
            <span className="inline-flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar en la clinica
            </span>
            <kbd className="rounded-md border border-white/25 bg-white/15 px-1.5 py-0.5 text-[11px] text-white/80">
              Ctrl K
            </kbd>
          </>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/45 px-4 py-20 backdrop-blur-sm"
          onClick={close}
          role="presentation"
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Buscador global"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Buscar pacientes, recetas, ordenes, conversaciones o medicos"
                className="h-10 flex-1 border-0 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400"
                aria-label="Busqueda global"
                aria-controls="global-search-results"
                aria-activedescendant={
                  flatResults[activeIndex] ? `search-result-${flatResults[activeIndex].id}` : undefined
                }
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden />}
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ensigna-primary"
                aria-label="Cerrar busqueda"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              id="global-search-results"
              ref={listRef}
              className="max-h-[62vh] overflow-y-auto p-2"
              role="listbox"
            >
              {debouncedQuery.length >= MIN_QUERY_LENGTH && !loading && results.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-gray-700">No encontramos resultados.</p>
                  <p className="mt-1 text-sm text-gray-500">Proba con DNI, apellido o un termino mas corto.</p>
                </div>
              ) : flatResults.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-gray-700">Escribi al menos 2 caracteres.</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Consejo: DNI, apellido, numero de documento o matricula suelen ser lo mas rapido.
                  </p>
                </div>
              ) : (
                Object.keys(groupedResults).map((group) => (
                  <section key={group} className="py-1">
                    <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {group === 'Acciones' ? 'Acciones rapidas' : group}
                    </p>
                    <div className="space-y-1">
                      {groupedResults[group].map((item) => {
                        resultIndex += 1;
                        const isActive = resultIndex === activeIndex;
                        return (
                          <button
                            key={item.id}
                            id={`search-result-${item.id}`}
                            type="button"
                            data-active={isActive ? 'true' : 'false'}
                            role="option"
                            aria-selected={isActive}
                            onMouseEnter={() => setActiveIndex(resultIndex)}
                            onClick={() => goToResult(item.href)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ensigna-primary ${
                              isActive ? 'bg-indigo-50 ring-1 ring-indigo-100' : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                              {item.icon}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-gray-900">
                                {item.title}
                              </span>
                              {item.subtitle && (
                                <span className="block truncate text-xs text-gray-500">{item.subtitle}</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
              <span className="inline-flex gap-3">
                <span>↑↓ navegar</span>
                <span>Enter abrir</span>
                <span>Esc cerrar</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
