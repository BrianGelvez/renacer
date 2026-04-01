"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Smartphone,
  Globe,
  Search,
  ChevronLeft,
  Loader2,
  Inbox,
  RefreshCw,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useConversationSocket } from "@/hooks/useConversationSocket";

type ChannelFilter = "all" | "whatsapp" | "web";

type ConversationRow = {
  id: string;
  channel: string;
  externalId: string;
  patientDni: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
};

type MessageRow = {
  id: string;
  direction: string;
  content: string;
  type: string;
  channel: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

function formatRelativeEs(dateIso: string): string {
  const d = new Date(dateIso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatClock(dateIso: string): string {
  return new Date(dateIso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationsSection() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<ChannelFilter>("all");
  const [search, setSearch] = useState("");
  const [list, setList] = useState<ConversationRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    id: string;
    channel: string;
    externalId: string;
    patientDni: string | null;
    messages: MessageRow[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState<null | "sending" | "failed">(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const canAccess = user?.role === "OWNER" || user?.role === "ADMIN";

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const channel =
        filter === "all" ? undefined : (filter as "whatsapp" | "web");
      const data = await apiClient.getMessageConversations(channel);
      setList(data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : null;
      setListError(
        typeof msg === "string" ? msg : "No se pudieron cargar las conversaciones.",
      );
    } finally {
      setListLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && canAccess) {
      loadList();
    }
  }, [authLoading, isAuthenticated, canAccess, loadList]);

  useEffect(() => {
    if (!selectedId || !canAccess) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const data = await apiClient.getMessageConversationById(selectedId);
        if (!cancelled) {
          setDetail({
            id: data.id,
            channel: data.channel,
            externalId: data.externalId,
            patientDni: data.patientDni,
            messages: data.messages,
          });
        }
      } catch {
        if (!cancelled) {
          setDetailError("No se pudo cargar el historial.");
          setDetail(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, canAccess]);

  useConversationSocket(
    selectedId,
    useCallback(
      (msg: unknown) => {
        // msg esperado: Message del backend
        if (!msg || typeof msg !== "object") return;
        const m = msg as Partial<MessageRow> & { conversationId?: string };
        if (!m.id || !m.createdAt || !m.content) return;
        setDetail((prev) => {
          if (!prev || prev.id !== selectedId) return prev;
          const exists = prev.messages.some((x) => x.id === m.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: String(m.id),
                direction: String(m.direction ?? "outbound"),
                content: String(m.content ?? ""),
                type: String(m.type ?? "text"),
                channel: String(m.channel ?? prev.channel),
                meta: (m.meta as any) ?? null,
                createdAt: String(m.createdAt),
              },
            ],
          };
        });
      },
      [selectedId],
    ),
  );

  useEffect(() => {
    // autoscroll al final
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [detail?.messages.length, selectedId, detailLoading]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.externalId.toLowerCase().includes(q) ||
        (c.patientDni && c.patientDni.toLowerCase().includes(q)),
    );
  }, [list, search]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-red flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
        <p className="text-gray-500 font-medium">Cargando…</p>
      </div>
    );
  }

  if (!isAuthenticated || !canAccess) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Sin acceso
        </h2>
        <p className="text-gray-600 text-sm">
          Solo propietarios y administradores pueden ver el historial de
          conversaciones.
        </p>
      </div>
    );
  }

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setMobileShowThread(true);
  };

  const ChannelBadge = ({ channel }: { channel: string }) => {
    const isWa = channel === "whatsapp";
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide ${
          isWa
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60"
            : "bg-sky-50 text-sky-700 ring-1 ring-sky-200/60"
        }`}
      >
        {isWa ? (
          <Smartphone className="w-3 h-3" />
        ) : (
          <Globe className="w-3 h-3" />
        )}
        {isWa ? "WhatsApp" : "Web"}
      </span>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-6rem)]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Conversaciones
          </h2>
          <p className="text-gray-500 mt-1 text-sm sm:text-base max-w-xl">
            Historial unificado del asistente: mensajes de WhatsApp y del chat
            web, ordenados por actividad.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadList()}
          disabled={listLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-4 h-4 ${listLoading ? "animate-spin" : ""}`}
          />
          Actualizar
        </button>
      </motion.div>

      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm shadow-gray-200/40 overflow-hidden flex flex-col lg:flex-row min-h-[560px] lg:min-h-[620px]">
        {/* Lista */}
        <div
          className={`flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100 lg:w-[min(380px,38%)] shrink-0 bg-gradient-to-b from-gray-50/80 to-white ${
            mobileShowThread ? "hidden lg:flex" : "flex"
          } lg:flex`}
        >
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex rounded-xl bg-gray-100/90 p-1 gap-1">
              {(
                [
                  { id: "all" as const, label: "Todos" },
                  { id: "whatsapp" as const, label: "WhatsApp" },
                  { id: "web" as const, label: "Web" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`flex-1 py-2 px-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                    filter === tab.id
                      ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/80"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por teléfono, sesión o DNI…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[rgba(209,106,138,0.2)] focus:border-ensigna-primary transition-shadow"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[280px] lg:min-h-0">
            {listError && (
              <div className="m-4 p-4 rounded-xl bg-red-50 text-red-800 text-sm border border-red-100">
                {listError}
              </div>
            )}
            {listLoading && !list.length ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Inbox className="w-7 h-7 text-gray-400" />
                </div>
                <p className="font-medium text-gray-900">No hay conversaciones</p>
                <p className="text-sm text-gray-500 mt-1 max-w-[240px]">
                  Cuando escriban por WhatsApp o por el chat web, aparecerán acá.
                </p>
              </div>
            ) : (
              <ul className="p-2 space-y-1">
                <AnimatePresence mode="popLayout">
                  {filteredList.map((c) => {
                    const active = selectedId === c.id;
                    return (
                      <motion.li
                        key={c.id}
                        layout
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <button
                          type="button"
                          onClick={() => selectConversation(c.id)}
                          className={`w-full text-left rounded-xl px-3 py-3 transition-all border ${
                            active
                              ? "bg-ensigna-accent-soft/90 border-[rgba(209,106,138,0.2)] shadow-sm"
                              : "border-transparent hover:bg-gray-50 hover:border-gray-100"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <ChannelBadge channel={c.channel} />
                            <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
                              {formatRelativeEs(c.updatedAt)}
                            </span>
                          </div>
                          <p className="font-mono text-sm text-gray-900 truncate font-medium">
                            {c.externalId}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>
                              {c._count.messages}{" "}
                              {c._count.messages === 1 ? "mensaje" : "mensajes"}
                            </span>
                            {c.patientDni && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="truncate">DNI {c.patientDni}</span>
                              </>
                            )}
                          </div>
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </div>

        {/* Hilo */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-white ${
            mobileShowThread ? "flex" : "hidden lg:flex"
          }`}
        >
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-5 ring-1 ring-gray-200/60">
                <MessageCircle className="w-10 h-10 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-800 text-lg">
                Elegí una conversación
              </p>
              <p className="text-sm mt-2 max-w-sm">
                Vas a ver el historial completo con mensajes entrantes y
                respuestas del asistente.
              </p>
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-gray-100 px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-white to-gray-50/50">
                <button
                  type="button"
                  className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-600"
                  onClick={() => setMobileShowThread(false)}
                  aria-label="Volver al listado"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {detail && <ChannelBadge channel={detail.channel} />}
                    {detail?.patientDni && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                        <User className="w-3 h-3" />
                        DNI {detail.patientDni}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-sm sm:text-base text-gray-900 font-semibold truncate">
                    {detail?.externalId ?? "…"}
                  </p>
                </div>
              </div>

              <div
                ref={threadRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_120px)]"
              >
                {detailLoading && (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-ensigna-primary animate-spin" />
                  </div>
                )}
                {detailError && (
                  <p className="text-center text-sm text-red-600">{detailError}</p>
                )}
                {!detailLoading &&
                  detail?.messages.map((m, idx) => {
                    const inbound = m.direction === "inbound";
                    const rendered =
                      m.type === "template" &&
                      m.meta &&
                      typeof m.meta === "object" &&
                      "renderedText" in m.meta &&
                      typeof (m.meta as any).renderedText === "string"
                        ? String((m.meta as any).renderedText)
                        : m.content;
                    const slug =
                      m.meta &&
                      typeof m.meta === "object" &&
                      "clinicSlug" in m.meta
                        ? String(m.meta.clinicSlug)
                        : null;
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`flex ${inbound ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[min(100%,520px)] rounded-2xl px-4 py-3 shadow-sm ${
                            inbound
                              ? "bg-white border border-gray-200/90 text-gray-800 rounded-tl-md"
                              : "gradient-red text-white rounded-tr-md shadow-ensigna-primary/20"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-2 ${
                              inbound ? "text-gray-400" : "text-white/70"
                            }`}
                          >
                            {inbound ? (
                              <>
                                <ArrowDownLeft className="w-3 h-3" />
                                Entrante
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3" />
                                Asistente
                              </>
                            )}
                            <span className="opacity-60 font-normal normal-case">
                              · {formatClock(m.createdAt)}
                            </span>
                          </div>
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {rendered}
                          </p>
                          {slug && (
                            <p
                              className={`mt-2 text-[11px] ${
                                inbound ? "text-gray-400" : "text-white/60"
                              }`}
                            >
                              Clínica: {slug}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                {!detailLoading &&
                  detail &&
                  detail.messages.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-8">
                      Esta conversación no tiene mensajes guardados.
                    </p>
                  )}
              </div>

              {/* Composer */}
              <div className="shrink-0 border-t border-gray-100 p-3 sm:p-4 bg-white">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedId) return;
                    const text = draft.trim();
                    if (!text) return;
                    setSending("sending");
                    try {
                      await apiClient.sendManualConversationMessage(selectedId, text);
                      setDraft("");
                      setSending(null);
                    } catch {
                      setSending("failed");
                      setTimeout(() => setSending(null), 2500);
                    }
                  }}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Escribir mensaje…"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(209,106,138,0.2)] focus:border-ensigna-primary"
                      disabled={detail?.channel !== "whatsapp" || sending === "sending"}
                    />
                    {detail?.channel !== "whatsapp" && (
                      <p className="text-[11px] text-gray-400 mt-1 px-1">
                        Envío manual disponible solo para WhatsApp.
                      </p>
                    )}
                    {sending === "failed" && (
                      <p className="text-[11px] text-red-600 mt-1 px-1">
                        No se pudo enviar. Revisá que el número esté permitido por Meta.
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl gradient-red text-white font-semibold text-sm hover:brightness-105 disabled:opacity-50"
                    disabled={
                      !draft.trim() ||
                      sending === "sending" ||
                      detail?.channel !== "whatsapp"
                    }
                  >
                    {sending === "sending" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Enviar
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
