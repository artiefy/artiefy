/* eslint-disable */
'use client';

import React, {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Image from 'next/image';

import {
  FileText,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Send,
  Video,
} from 'lucide-react';

interface WhatsAppInboxPageProps {
  searchParams: { session?: string };
}
interface InboxItem {
  id?: string;
  from?: string;
  to?: string;
  name?: string | null;
  timestamp: number;
  type: string;
  text?: string;
  direction: 'inbound' | 'outbound' | 'status';
  mediaId?: string;
  mediaType?: string;
  fileName?: string;
}

interface ApiInboxResponse {
  items: InboxItem[];
  total?: number;
}

interface UiTemplate {
  name: string;
  label: string;
  language: 'es' | 'en';
  langCode: string;
  body: string;
  example: string[];
  status: string;
}

interface Tag {
  id: number;
  name: string;
  color?: string;
}

interface Thread {
  waid: string;
  name?: string | null;
  lastTs: number;
  lastText?: string;
  items: InboxItem[];
  firstTs: number;
  isNew24h: boolean;
  remainingMs: number;
  isAlmostExpired: boolean;
}

/* ========= Helpers de tipado para respuestas JSON ========= */
interface ApiError {
  error: string;
}

interface CreateTagOk {
  tag: Tag;
}
type CreateTagResp = CreateTagOk | ApiError;

interface TagsOk {
  tags: Tag[];
}
type TagsResp = TagsOk | ApiError;

interface AssignedOk {
  assignedTagIds: number[];
}
type AssignedResp = AssignedOk | ApiError;

function isApiError(x: unknown): x is ApiError {
  return (
    typeof x === 'object' &&
    x !== null &&
    'error' in x &&
    typeof (x as Record<string, unknown>).error === 'string'
  );
}
function isCreateTagOk(x: unknown): x is CreateTagOk {
  if (typeof x !== 'object' || x === null) return false;
  if (!('tag' in x)) return false;
  const tag = (x as Record<string, unknown>).tag;
  return typeof tag === 'string' || (typeof tag === 'object' && tag !== null);
}
function isTagsOk(x: unknown): x is TagsOk {
  if (typeof x !== 'object' || x === null) return false;
  const tags = (x as Record<string, unknown>).tags;
  if (!Array.isArray(tags)) return false;
  return true;
}

function isAssignedOk(x: unknown): x is AssignedOk {
  return (
    typeof x === 'object' &&
    x !== null &&
    Array.isArray((x as Record<string, unknown>).assignedTagIds)
  );
}
/* ========================================================== */

function MediaMessage({ item }: { item: InboxItem }) {
  if (!item.mediaId) {
    return item.text ? (
      <div className="whitespace-pre-wrap">{item.text}</div>
    ) : null;
  }

  const src = `/api/super-admin/whatsapp/media?id=${encodeURIComponent(item.mediaId)}`;
  const downloadHref = `${src}&action=download`;
  const caption = item.text ? (
    <div className="mt-1 text-sm whitespace-pre-wrap">{item.text}</div>
  ) : null;

  switch ((item.type || '').toLowerCase()) {
    case 'image':
      return (
        <div className="space-y-1">
          <Image
            src={src}
            alt={item.fileName ?? 'Imagen'}
            width={500}
            height={300}
            className="max-h-72 rounded-lg"
          />
          {caption}
          <a
            href={downloadHref}
            className="inline-flex items-center gap-1 text-xs underline"
          >
            Descargar
          </a>
        </div>
      );
    case 'video':
      return (
        <div className="space-y-1">
          <video src={src} controls className="max-h-72 rounded-lg" />
          {caption}
          <a
            href={downloadHref}
            className="inline-flex items-center gap-1 text-xs underline"
          >
            Descargar
          </a>
        </div>
      );
    case 'audio':
      return (
        <div className="space-y-1">
          <audio src={src} controls className="w-64" />
          {caption}
          <a
            href={downloadHref}
            className="inline-flex items-center gap-1 text-xs underline"
          >
            Descargar
          </a>
        </div>
      );
    case 'document':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-lg border border-gray-700 bg-[#1A2930] p-3">
            <FileText className="h-8 w-8 flex-shrink-0 text-blue-400" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-100">
                {item.fileName ?? 'Documento'}
              </div>
              {item.mediaType && (
                <div className="mt-0.5 text-xs text-[#8696A0]">
                  {item.mediaType.split('/').pop()?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
          {caption}
          <a
            href={downloadHref}
            className="inline-flex items-center gap-1 text-xs text-emerald-400 underline hover:text-emerald-300"
          >
            <FileText className="h-3 w-3" />
            Descargar
          </a>
        </div>
      );
    default:
      return (
        <div className="space-y-1">
          <div className="text-sm text-[#8696A0]">
            Archivo multimedia ({item.type})
          </div>
          {caption}
          <a
            href={downloadHref}
            className="inline-flex items-center gap-1 text-xs underline"
          >
            Descargar
          </a>
        </div>
      );
  }
}

function CreateQuickTag({ onCreated }: { onCreated: (t: Tag) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#22c55e');
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const r = await fetch('/api/super-admin/whatsapp/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      const j = (await r.json()) as unknown as CreateTagResp;
      if (!r.ok) {
        const msg = isApiError(j)
          ? (j.error ?? 'Error creando etiqueta')
          : 'Error creando etiqueta';
        throw new Error(msg ?? 'Error creando etiqueta');
      }
      if (isCreateTagOk(j)) onCreated(j.tag);
      setName('');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo crear la etiqueta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void create();
          }
        }}
        placeholder="Nueva etiqueta"
        className="flex-1 rounded border-0 bg-[#2A3942] px-3 py-2 text-sm text-gray-100 placeholder-[#8696A0] focus:ring-1 focus:ring-emerald-600 focus:outline-none"
      />
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent"
        title="Color"
      />
      <button
        onClick={create}
        disabled={saving || !name.trim()}
        className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {saving ? '...' : 'Crear'}
      </button>
    </div>
  );
}

export default function WhatsAppInboxPage({
  searchParams,
}: WhatsAppInboxPageProps) {
  const session = searchParams.session ?? 'soporte';
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [compose, setCompose] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCaption, setFileCaption] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showTplModal, setShowTplModal] = useState(false);
  const [tplLoading, setTplLoading] = useState(false);
  const [tplError, setTplError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<UiTemplate[]>([]);
  const [tplSelected, setTplSelected] = useState<UiTemplate | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [assignedTagIds, setAssignedTagIds] = useState<number[]>([]);
  const [tagFilter, setTagFilter] = useState<number | 'ALL'>('ALL');
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagAssignmentsCache, setTagAssignmentsCache] = useState<
    Record<string, number[]>
  >({});

  // Configuración de la sesión actual
  const sessionName = session;

  const getInitialHiddenWaids = (): Set<string> => {
    try {
      if (typeof window === 'undefined') return new Set();
      const saved = sessionStorage.getItem('wa_hidden_chats');
      if (!saved) return new Set();
      const parsed: unknown = JSON.parse(saved);
      if (
        Array.isArray(parsed) &&
        parsed.every((v): v is string => typeof v === 'string')
      ) {
        return new Set(parsed);
      }
      return new Set();
    } catch {
      return new Set();
    }
  };

  const [hiddenWaids, setHiddenWaids] = useState<Set<string>>(
    getInitialHiddenWaids
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(
      'wa_hidden_chats',
      JSON.stringify(Array.from(hiddenWaids))
    );
  }, [hiddenWaids]);

  const [filterName, setFilterName] = useState('');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [filterHours, setFilterHours] = useState<string>('');
  const [filterWindow, setFilterWindow] = useState<
    'all' | 'active24' | 'almost' | 'expired'
  >('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true); // Default true para evitar hidratación
  const [userSelectedChat, setUserSelectedChat] = useState(false); // Track if user manually selected

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const threads = useMemo<Thread[]>(() => {
    const map = new Map<string, InboxItem[]>();
    for (const it of inbox) {
      const key = (it.from ?? it.to ?? 'unknown')!;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    const list: Thread[] = [];
    for (const [waid, items] of map.entries()) {
      const sorted = items.slice().sort((a, b) => a.timestamp - b.timestamp);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const name =
        sorted.find((x) => x.name)?.name ??
        sorted.find((x) => x.from)?.from ??
        undefined;

      const lastInbound = sorted
        .slice()
        .reverse()
        .find((msg) => msg.direction === 'inbound');
      const lastInboundTs = lastInbound?.timestamp ?? 0;

      const firstTs = first?.timestamp ?? 0;
      const elapsed = lastInboundTs
        ? now - lastInboundTs
        : Number.POSITIVE_INFINITY;
      const remainingMs = Math.max(0, ONE_DAY - elapsed);
      const isNew24h = remainingMs > 0;
      const isAlmostExpired = isNew24h && remainingMs <= TWO_HOURS;

      list.push({
        waid,
        name,
        lastTs: last?.timestamp ?? 0,
        lastText: last?.text ?? '',
        items: sorted,
        firstTs,
        isNew24h,
        remainingMs,
        isAlmostExpired,
      });
    }
    return list.sort((a, b) => b.lastTs - a.lastTs);
  }, [inbox]);

  const waidsKey = useMemo(
    () =>
      threads
        .map((t) => t.waid)
        .sort()
        .join(','),
    [threads]
  );

  useEffect(() => {
    if (!waidsKey) return;
    let cancel = false;

    (async () => {
      const waids = waidsKey.split(',').filter(Boolean);
      for (const waid of waids) {
        if ((tagAssignmentsCache[waid] ?? undefined) !== undefined) continue;

        try {
          const r = await fetch(
            `/api/super-admin/whatsapp/inbox/tags?waid=${encodeURIComponent(waid)}`,
            { cache: 'no-store' }
          );
          const j = (await r.json()) as unknown as AssignedResp;
          const ids = isAssignedOk(j) ? j.assignedTagIds : [];
          if (!cancel) {
            setTagAssignmentsCache((prev) => ({ ...prev, [waid]: ids }));
          }
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`wa_tagmap_${waid}`, JSON.stringify(ids));
          }
        } catch {
          if (!cancel) {
            setTagAssignmentsCache((prev) => ({ ...prev, [waid]: [] }));
          }
        }
      }
    })();

    return () => {
      cancel = true;
    };
  }, [waidsKey, tagAssignmentsCache]);

  const filteredThreads = useMemo(() => {
    const name = filterName.trim().toLowerCase();
    const fromMs = filterFrom
      ? new Date(filterFrom).setHours(0, 0, 0, 0)
      : null;
    const toMs = filterTo ? new Date(filterTo).setHours(23, 59, 59, 999) : null;
    const withinHours = filterHours ? Number(filterHours) : null;
    const now = Date.now();

    return threads.filter((t) => {
      if (hiddenWaids.has(t.waid)) return false;
      if (name && !`${t.name ?? ''} ${t.waid}`.toLowerCase().includes(name))
        return false;
      if (fromMs !== null && t.lastTs < fromMs) return false;
      if (toMs !== null && t.lastTs > toMs) return false;
      if (withinHours !== null && withinHours > 0) {
        if (now - t.lastTs > withinHours * 3600 * 1000) return false;
      }
      if (filterWindow === 'active24' && !t.isNew24h) return false;
      if (filterWindow === 'almost' && !t.isAlmostExpired) return false;
      if (filterWindow === 'expired' && t.isNew24h) return false;

      if (tagFilter !== 'ALL') {
        let ids = tagAssignmentsCache[t.waid];

        if (ids === undefined && typeof window !== 'undefined') {
          try {
            const raw = sessionStorage.getItem(`wa_tagmap_${t.waid}`);
            if (raw) ids = JSON.parse(raw) as number[];
          } catch {
            /* ignore */
          }
        }

        if (!Array.isArray(ids) || !ids.includes(tagFilter as number)) {
          return false;
        }
      }

      return true;
    });
  }, [
    threads,
    filterName,
    filterFrom,
    filterTo,
    filterHours,
    filterWindow,
    hiddenWaids,
    tagFilter,
    tagAssignmentsCache,
  ]);

  useEffect(() => {
    const saved = sessionStorage.getItem('wa_selected_chat');
    if (saved && isDesktop) {
      setSelected(saved);
    }
  }, [isDesktop]);

  // Auto-hide sidebar on mobile when chat is selected
  useEffect(() => {
    // sidebar se oculta automáticamente en móvil cuando hay chat seleccionado
  }, [isDesktop]);

  useEffect(() => {
    if (!selected && threads.length) setSelected(threads[0].waid);
    if (selected) sessionStorage.setItem('wa_selected_chat', selected);
  }, [threads, selected]);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/super-admin/whatsapp/inbox?session=${sessionName}`,
          {
            cache: 'no-store',
          }
        );
        const data = (await res.json()) as ApiInboxResponse;
        if (!cancel) {
          const serverItems = Array.isArray(data?.items) ? data.items : [];

          setInbox((prevInbox) => {
            // Obtener mensajes locales (los que tienen id local-...)
            const localMessages = prevInbox.filter((m) =>
              m.id?.startsWith('local-')
            );

            // Si no hay mensajes locales, simplemente usar los del servidor
            if (localMessages.length === 0) {
              return serverItems;
            }

            // Crear un Set con los IDs del servidor para búsqueda rápida

            // Mantener mensajes locales que aún no están en el servidor
            const pendingLocalMessages = localMessages.filter((local) => {
              // Buscar si existe un mensaje similar en el servidor
              const existsInServer = serverItems.some((server) => {
                // Comparar por texto, destinatario y timestamp similar (dentro de 15 segundos)
                return (
                  server.text === local.text &&
                  server.to === local.to &&
                  Math.abs((server.timestamp || 0) - (local.timestamp || 0)) <
                    15000
                );
              });

              return !existsInServer;
            });

            // Combinar: mensajes del servidor + mensajes locales pendientes
            return [...pendingLocalMessages, ...serverItems];
          });
        }
      } catch {
        if (!cancel) setInbox([]);
      }
    };
    void load();
    const iv = setInterval(load, 4000);
    return () => {
      cancel = true;
      clearInterval(iv);
    };
  }, [sessionName]);
  useEffect(() => {
    const loadTags = async () => {
      try {
        const r = await fetch('/api/super-admin/whatsapp/tags', {
          cache: 'no-store',
        });
        const j = (await r.json()) as unknown as TagsResp;
        if (isTagsOk(j)) setAllTags(j.tags);
        else setAllTags([]);
      } catch {
        setAllTags([]);
      }
    };
    void loadTags();
  }, []);

  useEffect(() => {
    const loadAssigned = async (waid: string) => {
      try {
        const r = await fetch(
          `/api/super-admin/whatsapp/inbox/tags?waid=${encodeURIComponent(waid)}`,
          { cache: 'no-store' }
        );
        const j = (await r.json()) as unknown as AssignedResp;
        const ids = isAssignedOk(j) ? j.assignedTagIds : [];
        setAssignedTagIds(ids);
        setTagAssignmentsCache((prev) => ({ ...prev, [waid]: ids }));
      } catch {
        setAssignedTagIds([]);
      }
    };
    if (selected) void loadAssigned(selected);
    else setAssignedTagIds([]);
  }, [selected]);

  const activeItems = useMemo(
    () => threads.find((t) => t.waid === (selected ?? ''))?.items ?? [],
    [threads, selected]
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 9999;
  }, [activeItems.length]);

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });

  const fmtDuration = (ms: number) => {
    const totalMin = Math.max(0, Math.floor(ms / 60000));
    const d = Math.floor(totalMin / (60 * 24));
    const h = Math.floor((totalMin % (60 * 24)) / 60);
    const m = totalMin % 60;
    const parts: string[] = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m || parts.length === 0) parts.push(`${m}m`);
    return parts.join(' ');
  };

  const lastInboundId = (waid: string) =>
    threads
      .find((t) => t.waid === waid)
      ?.items.slice()
      .reverse()
      .find((m) => m.direction === 'inbound' && m.id)?.id;

  const handleFileUpload = async (waid: string) => {
    if (!selectedFile) return;

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('to', waid);
      formData.append('session', sessionName);
      if (fileCaption) {
        formData.append('caption', fileCaption);
      }

      const res = await fetch('/api/super-admin/whatsapp/media', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as
          | ApiError
          | Record<string, unknown>;
        const errMsg = isApiError(errorData)
          ? (errorData.error ?? 'Error enviando archivo')
          : 'Error enviando archivo';
        throw new Error(errMsg ?? 'Error enviando archivo');
      }

      setSelectedFile(null);
      setFileCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert('Archivo enviado correctamente');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(
        'Error al enviar el archivo: ' +
          (error instanceof Error ? error.message : 'Error desconocido')
      );
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSend = async (waid: string) => {
    const text = (compose[waid] || '').trim();
    if (!text) return;

    try {
      setSending(waid);
      const replyTo = lastInboundId(waid);

      const res = await fetch('/api/super-admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: waid,
          text,
          autoSession: true,
          replyTo,
          session: sessionName,
        }),
      });

      if (!res.ok) {
        let errMsg = `Error enviando WhatsApp (HTTP ${res.status})`;
        try {
          const j: unknown = await res.json();
          if (typeof j === 'object' && j !== null && 'error' in j) {
            const maybe = (j as { error?: unknown }).error;
            if (typeof maybe === 'string' && maybe.trim()) errMsg = maybe;
          }
        } catch (parseErr) {
          console.debug('[WA] Error parseando cuerpo JSON de error:', parseErr);
        }
        throw new Error(errMsg);
      }

      const localId = 'local-' + Date.now();
      setInbox((prev) => [
        {
          id: localId,
          direction: 'outbound',
          timestamp: Date.now(),
          to: waid,
          type: 'text',
          text,
        },
        ...prev,
      ]);
      setCompose((p) => ({ ...p, [waid]: '' }));

      // Eliminar mensaje local después de 8 segundos (el polling ya habrá traído el real)
      setTimeout(() => {
        setInbox((prev) => prev.filter((m) => m.id !== localId));
      }, 8000);
    } catch (e) {
      console.error(e);
      const msg =
        e instanceof Error ? e.message : 'No se pudo enviar el WhatsApp';
      alert(msg);
    } finally {
      setSending(null);
    }
  };

  const openTemplatePicker = async () => {
    try {
      setTplError(null);
      setShowTplModal(true);
      setTplLoading(true);

      const res = await fetch(
        `/api/super-admin/whatsapp?session=${sessionName}`,
        { method: 'GET' }
      );
      const data = (await res.json()) as { templates?: UiTemplate[] };

      const list = Array.isArray(data.templates)
        ? data.templates.filter((t) => t.status === 'APPROVED')
        : [];

      setTemplates(list);

      const prefer =
        list.find((t) => t.name.toLowerCase() === 'bienvenida') ??
        list.find((t) => t.name.toLowerCase() === 'hello_world') ??
        list[0] ??
        null;

      setTplSelected(prefer);
    } catch (_e) {
      setTplError('No se pudieron cargar las plantillas');
    } finally {
      setTplLoading(false);
    }
  };

  const sendWithTemplateThenText = async (waid: string) => {
    if (!tplSelected) return;
    // NO leer el texto del compose
    try {
      setSending(waid);
      const replyToId = lastInboundId(waid);

      const now = Date.now();
      const localTplId = 'local-tpl-' + now;
      setInbox((prev) => [
        {
          id: localTplId,
          direction: 'outbound',
          timestamp: now,
          to: waid,
          type: 'template',
          text: tplSelected.body || `[Plantilla: ${tplSelected.name}]`,
        },
        ...prev,
      ]);

      // Eliminar mensaje local después de 8 segundos (el polling ya habrá traído el real)
      setTimeout(() => {
        setInbox((prev) => prev.filter((m) => m.id !== localTplId));
      }, 8000);

      const res = await fetch('/api/super-admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: waid,
          // NO incluir text
          autoSession: true,
          replyTo: replyToId,
          sessionTemplate: tplSelected.name,
          sessionLanguage: tplSelected.langCode,
          session: sessionName,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        templateOpened?: { messages?: { id?: string }[] };
        textMessage?: unknown;
        step?: string;
        success?: boolean;
        error?: string;
      };

      if (!res.ok) {
        setInbox((prev) => prev.filter((m) => m.id !== localTplId));
        const errMsg =
          (typeof body?.error === 'string' && body.error.trim()) ??
          `Error enviando WhatsApp (HTTP ${res.status})`;
        throw new Error(errMsg);
      }

      const metaTplId = body?.templateOpened?.messages?.[0]?.id;
      if (metaTplId) {
        setInbox((prev) =>
          prev.map((m) => (m.id === localTplId ? { ...m, id: metaTplId } : m))
        );
      }

      // Limpiar el input
      setCompose((p) => ({ ...p, [waid]: '' }));

      setShowTplModal(false);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'No se pudo enviar el WhatsApp');
    } finally {
      setSending(null);
    }
  };
  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>, waid: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const t = threads.find((x) => x.waid === waid);
      if (t && !t.isNew24h) {
        void openTemplatePicker();
      } else {
        void handleSend(waid);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 64 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. El tamaño máximo es 64MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hideConversation = (waid: string) => {
    const newHidden = new Set(hiddenWaids);
    newHidden.add(waid);
    setHiddenWaids(newHidden);
    sessionStorage.setItem('wa_hidden_chats', JSON.stringify([...newHidden]));

    if (selected === waid) {
      const remaining = filteredThreads.filter((t) => t.waid !== waid);
      setSelected(remaining[0]?.waid ?? null);
    }
  };

  const restoreAllConversations = () => {
    setHiddenWaids(new Set());
    sessionStorage.removeItem('wa_hidden_chats');
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/'))
      return <ImageIcon className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (file.type.startsWith('audio/')) return <Mic className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  useEffect(() => {
    // Inicializar en true si estamos en escritorio
    const isLargeScreen = window.innerWidth >= 768;
    setIsDesktop(isLargeScreen);

    // Listener para cambios de tamaño
    const handleResize = () => {
      const isLarge = window.innerWidth >= 768;
      setIsDesktop(isLarge);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#0B141A]">
      {/* SIDEBAR - Lista de chats (móvil: oculto cuando hay chat seleccionado) */}
      <aside
        className={`${
          selected && !isDesktop && userSelectedChat ? 'hidden' : 'flex'
        } w-full flex-col border-r border-gray-800 bg-[#111B21] text-gray-200 transition-all duration-200 md:w-72`}
      >
        {/* Header de sidebar */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-800 bg-[#202C33] px-3.5 py-3 md:px-4 md:py-4">
          <div className="text-lg font-bold text-gray-100 md:text-xl">
            Chats
          </div>
          <div className="flex items-center gap-2">
            {hiddenWaids.size > 0 && (
              <button
                onClick={restoreAllConversations}
                className="px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300"
                title={`Restaurar ${hiddenWaids.size} conversación(es)`}
              >
                ({hiddenWaids.size})
              </button>
            )}
          </div>
        </div>

        {/* Buscador */}
        <div className="flex-shrink-0 bg-[#0B141A] px-3 py-2 md:px-4">
          <input
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Buscar chats"
            className="w-full rounded-full border-0 bg-[#2A3942] px-4 py-2 text-sm text-gray-100 placeholder-[#8696A0] focus:ring-1 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        {/* Botón de filtros (móvil) */}
        <div className="border-b border-gray-800 bg-[#0B141A] px-3 py-2 md:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full py-2 text-center text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            {showFilters ? '▼ Ocultar filtros' : '▶ Mostrar filtros'}
          </button>
        </div>

        {/* Filtros avanzados (ocultos en móvil por defecto) */}
        {(showFilters || isDesktop) && (
          <div className="max-h-fit flex-shrink-0 space-y-2 overflow-auto border-b border-gray-800 bg-[#0B141A] px-3 pt-2 pb-2 text-xs text-[#8696A0] md:px-4 md:pt-1 md:pb-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="rounded border-0 bg-[#2A3942] px-2 py-1.5 text-xs text-gray-100 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                title="Desde"
              />
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="rounded border-0 bg-[#2A3942] px-2 py-1.5 text-xs text-gray-100 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                title="Hasta"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                value={filterHours}
                onChange={(e) => setFilterHours(e.target.value)}
                placeholder="Últimas (h)"
                className="rounded border-0 bg-[#2A3942] px-2 py-1.5 text-xs text-gray-100 placeholder-[#8696A0] focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
              <select
                value={filterWindow}
                onChange={(e) =>
                  setFilterWindow(e.target.value as typeof filterWindow)
                }
                className="rounded border-0 bg-[#2A3942] px-2 py-1.5 text-xs text-gray-100 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="all">Todos</option>
                <option value="active24">Activos (≤24h)</option>
                <option value="almost">Casi expira</option>
                <option value="expired">Expirados</option>
              </select>
            </div>
            <select
              value={tagFilter === 'ALL' ? 'ALL' : String(tagFilter)}
              onChange={(e) => {
                const v = e.target.value;
                setTagFilter(v === 'ALL' ? 'ALL' : Number(v));
              }}
              className="w-full rounded border-0 bg-[#2A3942] px-2 py-1.5 text-xs text-gray-100 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="ALL">Todas las etiquetas</option>
              {allTags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lista de chats */}
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 && (
            <div className="p-4 text-center text-sm text-[#8696A0]">
              {filterName || tagFilter !== 'ALL'
                ? 'Sin chats.'
                : 'No hay chats'}
            </div>
          )}
          {filteredThreads.map((t) => (
            <button
              key={t.waid}
              onClick={() => {
                setSelected(t.waid);
                setUserSelectedChat(true);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (confirm(`¿Ocultar "${t.name ?? t.waid}"?`)) {
                  hideConversation(t.waid);
                }
              }}
              className={`flex w-full items-center gap-3 border-b border-gray-800/50 px-3 py-2.5 text-left transition-colors hover:bg-[#202C33] md:px-4 md:py-3 ${selected === t.waid ? 'bg-[#2A3942]' : ''}`}
            >
              {/* Avatar */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#25D366] to-[#20BA5A] font-bold text-white md:h-11 md:w-11">
                {(t.name ?? t.waid).charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                {/* Nombre y hora */}
                <div className="mb-0.5 flex items-baseline justify-between gap-2">
                  <div className="truncate text-sm font-medium text-gray-100 md:text-base">
                    {t.name ?? t.waid}
                  </div>
                  <div className="flex-shrink-0 text-[11px] text-[#8696A0] md:text-xs">
                    {t.lastTs ? fmtTime(t.lastTs) : ''}
                  </div>
                </div>

                {/* Mensaje preview */}
                <div className="truncate text-xs text-[#8696A0] md:text-sm">
                  {t.lastText || '(sin mensajes)'}
                </div>

                {/* Indicadores de estado y etiquetas */}
                {(tagAssignmentsCache[t.waid]?.length || 0) > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(tagAssignmentsCache[t.waid] ?? []).map((id) => {
                      const tag = allTags.find((x) => x.id === id);
                      if (!tag) return null;
                      return (
                        <span
                          key={`${t.waid}-tag-${id}`}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
                          style={{
                            background: (tag.color ?? '#22c55e') + '25',
                            color: tag.color ?? '#22c55e',
                            border: `1px solid ${(tag.color ?? '#22c55e') + '40'}`,
                          }}
                        >
                          ● {tag.name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Indicador de estado ventana */}
              <div className="flex-shrink-0 text-lg md:text-base">
                {t.isNew24h ? (t.isAlmostExpired ? '⏳' : '✓') : '✗'}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* CHAT SECTION - Fullscreen en móvil cuando hay chat */}
      <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#0B141A]">
        {/* Header del chat - STICKY AL TOP */}
        <div className="sticky top-0 z-40 flex flex-shrink-0 items-center gap-2 border-b border-gray-800 bg-[#202C33] px-3 py-2.5 text-gray-100 md:gap-3 md:px-4 md:py-3">
          {!isDesktop && selected && (
            <button
              onClick={() => {
                setSelected(null);
                setUserSelectedChat(false);
              }}
              className="-ml-2 rounded-full p-2 text-[#8696A0] transition-colors hover:bg-white/10 hover:text-gray-100"
              aria-label="Volver a chats"
              title="Volver"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#25D366] to-[#20BA5A] font-bold text-white md:h-9 md:w-9">
            {selected
              ? (
                  threads.find((t) => t.waid === selected)?.name ??
                  selected ??
                  '—'
                )
                  .charAt(0)
                  .toUpperCase()
              : '—'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-100 md:text-base">
              {threads.find((t) => t.waid === selected)?.name ??
                selected ??
                'Selecciona un chat'}
            </div>
            <div className="truncate text-xs text-[#8696A0]">
              {selected ? selected : ''}
            </div>
          </div>

          {selected && (
            <button
              onClick={() => setShowTagModal(true)}
              className="-mr-2 rounded-full p-2 text-[#8696A0] hover:bg-white/10 hover:text-gray-100 md:hidden"
              title="Etiquetas"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 0 1 0 2.828l-7 7a2 2 0 0 1-2.828 0l-7-7A1.994 1.994 0 0 1 3 12V7a4 4 0 0 1 4-4z"
                />
              </svg>
            </button>
          )}

          {selected && (
            <a
              href="/dashboard/super-admin"
              className="inline-flex items-center justify-center rounded-full p-2 text-[#8696A0] transition-colors hover:bg-white/10 hover:text-gray-100"
              title="Volver al inicio"
              aria-label="Volver al inicio"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </a>
          )}
        </div>

        {/* Contenedor de scroll - SIN PADDING, flex layout puro */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Área de mensajes */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col space-y-1.5 overflow-y-auto px-3 py-3 md:space-y-2 md:px-4 md:py-4"
            style={{
              backgroundImage: "url('/wallWhat.png')",
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#0B141A',
            }}
          >
            {!selected && (
              <div className="flex h-full items-center justify-center text-center text-sm text-[#8696A0]">
                👈 Selecciona un chat
              </div>
            )}

            {selected &&
              activeItems.map((m) => {
                if (m.direction === 'status') {
                  return (
                    <div
                      key={m.id ?? String(m.timestamp)}
                      className="mx-auto w-fit max-w-[85%] rounded-full bg-[#202C33]/70 px-3 py-1 text-center text-[11px] text-gray-300 md:text-xs"
                      title={m.id ? `id: ${m.id}` : ''}
                    >
                      {m.text}
                    </div>
                  );
                }

                const isOutbound = m.direction === 'outbound';
                return (
                  <div
                    key={m.id ?? String(m.timestamp)}
                    className={`flex w-full ${isOutbound ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 break-words md:max-w-[60%] md:px-3.5 md:py-2.5 ${
                        isOutbound
                          ? 'rounded-br-none bg-[#005C4B] text-white'
                          : 'rounded-bl-none bg-[#262D31] text-gray-100'
                      }`}
                      title={m.id ? `id: ${m.id}` : ''}
                    >
                      {m.mediaId &&
                      ['image', 'video', 'audio', 'document'].includes(
                        (m.type || '').toLowerCase()
                      ) ? (
                        <MediaMessage item={m} />
                      ) : m.type === 'template' ? (
                        <div>
                          <div className="mb-1 text-xs text-white/60 italic">
                            📋 Plantilla
                          </div>
                          <div className="text-sm whitespace-pre-wrap">
                            {m.text}
                          </div>
                        </div>
                      ) : (
                        m.text && (
                          <div className="text-sm whitespace-pre-wrap">
                            {m.text}
                          </div>
                        )
                      )}

                      <div
                        className={`mt-1 text-right text-[10px] ${isOutbound ? 'text-white/60' : 'text-[#8696A0]'}`}
                      >
                        {fmtTime(m.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Área de composición - STICKY AL BOTTOM */}
        <div className="sticky bottom-0 z-40 flex-shrink-0 space-y-2 border-t border-gray-800 bg-[#202C33] p-2 md:p-3">
          {/* Preview de archivo */}
          {selectedFile && (
            <div className="rounded bg-[#2A3942] px-3 py-2 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {getFileIcon(selectedFile)}
                  <span className="truncate text-xs text-gray-200 md:text-sm">
                    {selectedFile.name}
                  </span>
                  <span className="flex-shrink-0 text-xs text-[#8696A0]">
                    ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
                  </span>
                </div>
                <button
                  onClick={removeSelectedFile}
                  className="ml-2 flex-shrink-0 text-lg leading-none text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>

              {(selectedFile.type.startsWith('image/') ||
                selectedFile.type.startsWith('video/')) && (
                <input
                  type="text"
                  placeholder="Pie de foto (opcional)"
                  value={fileCaption}
                  onChange={(e) => setFileCaption(e.target.value)}
                  className="w-full rounded border-0 bg-[#3a4554] px-2 py-1.5 text-xs text-gray-100 placeholder-[#8696A0] focus:ring-1 focus:ring-emerald-600 focus:outline-none md:text-sm"
                />
              )}
            </div>
          )}

          {/* Input de mensaje */}
          <div className="flex items-end gap-2 md:gap-2.5">
            {/* Botón de adjuntar */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!!selectedFile}
              className="flex-shrink-0 rounded-full bg-[#2A3942] p-2.5 text-[#8696A0] transition-colors hover:bg-[#374854] disabled:opacity-50"
              title="Adjuntar"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Campo de texto */}
            <div className="flex flex-1 items-end gap-1.5 rounded-full bg-[#2A3942] px-3.5 py-1.5 md:px-4 md:py-2">
              <textarea
                disabled={!selected}
                rows={1}
                onKeyDown={(e) => selected && handleKey(e, selected)}
                className="max-h-24 flex-1 resize-none bg-transparent py-1.5 text-sm leading-5 text-gray-100 placeholder-[#8696A0] focus:outline-none disabled:opacity-40 md:max-h-32 md:py-1.5 md:text-base md:leading-6"
                placeholder={
                  selected ? 'Escribe un mensaje' : 'Selecciona chat…'
                }
                value={selected ? compose[selected] || '' : ''}
                onChange={(e) =>
                  selected &&
                  setCompose((prev) => ({
                    ...prev,
                    [selected]: e.target.value,
                  }))
                }
                style={{ scrollbarWidth: 'none' }}
              />
            </div>

            {/* Botón enviar */}
            <button
              disabled={
                !selected ||
                sending === selected ||
                (!(compose[selected ?? ''] || '').trim() && !selectedFile)
              }
              onClick={() => {
                if (!selected) return;
                if (selectedFile) {
                  void handleFileUpload(selected);
                } else {
                  const t = threads.find((x) => x.waid === selected);
                  if (t && !t.isNew24h) {
                    void openTemplatePicker();
                  } else {
                    void handleSend(selected);
                  }
                }
              }}
              className="flex-shrink-0 rounded-full bg-[#25D366] p-2.5 text-white transition-colors hover:bg-[#20BA5A] disabled:bg-[#2A3942] disabled:opacity-40"
              title="Enviar"
            >
              {selectedFile ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Modal de plantillas */}
      {showTplModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
          <div className="w-full rounded-t-2xl border-t border-gray-800 bg-[#111B21] text-gray-100 md:w-full md:max-w-lg md:rounded-2xl md:border">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-800 bg-[#111B21] px-4 py-3">
              <h3 className="text-sm font-semibold md:text-base">Plantillas</h3>
              <button
                onClick={() => setShowTplModal(false)}
                className="text-xl leading-none text-[#8696A0] hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3 md:p-4">
              {tplLoading && (
                <div className="text-sm text-[#8696A0]">Cargando…</div>
              )}
              {tplError && (
                <div className="text-sm text-red-400">{tplError}</div>
              )}
              {!tplLoading && templates.length === 0 && (
                <div className="text-sm text-[#8696A0]">Sin plantillas.</div>
              )}

              {!tplLoading &&
                templates.map((tpl) => (
                  <label
                    key={tpl.name + tpl.langCode}
                    className="flex cursor-pointer items-start gap-3 rounded-lg bg-[#202C33] p-3 transition-colors hover:bg-[#2A3942]"
                  >
                    <input
                      type="radio"
                      name="tpl"
                      checked={
                        tplSelected?.name === tpl.name &&
                        tplSelected?.langCode === tpl.langCode
                      }
                      onChange={() => setTplSelected(tpl)}
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium md:text-sm">
                        {tpl.label}
                        <span className="ml-1 text-[10px] text-[#8696A0] md:text-xs">
                          ({tpl.langCode})
                        </span>
                      </div>
                      {tpl.body && (
                        <div className="mt-1 line-clamp-2 text-[11px] whitespace-pre-wrap text-[#cbd5e1] md:text-xs">
                          {tpl.body}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
            </div>

            <div className="sticky bottom-0 flex gap-2 border-t border-gray-800 bg-[#111B21] px-4 py-3">
              <button
                className="flex-1 rounded bg-[#202C33] px-3 py-2 text-sm text-[#e5e7eb] hover:bg-[#2A3942]"
                onClick={() => setShowTplModal(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
                disabled={!tplSelected || !selected || sending === selected}
                onClick={() => selected && sendWithTemplateThenText(selected)}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de etiquetas */}
      {showTagModal && selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
          <div className="w-full rounded-t-2xl border-t border-gray-800 bg-[#111B21] text-gray-100 md:w-full md:max-w-md md:rounded-2xl md:border">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-800 bg-[#111B21] px-4 py-3">
              <h3 className="text-sm font-semibold md:text-base">Etiquetas</h3>
              <button
                onClick={() => setShowTagModal(false)}
                className="text-xl leading-none text-[#8696A0] hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3 md:p-4">
              <div className="text-[11px] text-[#94a3b8] md:text-xs">
                Marca para asignar
              </div>

              {allTags.length === 0 && (
                <div className="text-sm text-[#8696A0]">Sin etiquetas.</div>
              )}

              {allTags.map((t) => {
                const checked = assignedTagIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg bg-[#202C33] p-3 transition-colors hover:bg-[#2A3942]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={async (e) => {
                        try {
                          if (e.target.checked) {
                            await fetch(
                              '/api/super-admin/whatsapp/inbox/tags',
                              {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  waid: selected,
                                  tagId: t.id,
                                }),
                              }
                            );
                            const newIds = [
                              ...new Set([...assignedTagIds, t.id]),
                            ];
                            setAssignedTagIds(newIds);
                            setTagAssignmentsCache((prev) => ({
                              ...prev,
                              [selected]: newIds,
                            }));
                          } else {
                            await fetch(
                              '/api/super-admin/whatsapp/inbox/tags',
                              {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  waid: selected,
                                  tagId: t.id,
                                }),
                              }
                            );
                            const newIds = assignedTagIds.filter(
                              (x) => x !== t.id
                            );
                            setAssignedTagIds(newIds);
                            setTagAssignmentsCache((prev) => ({
                              ...prev,
                              [selected]: newIds,
                            }));
                          }
                        } catch {
                          alert('Error al actualizar');
                        }
                      }}
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs font-medium md:text-sm">
                        <span
                          className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ background: t.color ?? '#22c55e' }}
                        />
                        <span className="truncate">{t.name}</span>
                      </div>
                    </div>
                  </label>
                );
              })}

              <div className="mt-3 rounded-lg border border-gray-700 bg-[#202C33] p-3">
                <div className="mb-2 text-[10px] font-medium text-[#94a3b8] md:text-xs">
                  Nueva:
                </div>
                <CreateQuickTag
                  onCreated={(tag) => {
                    setAllTags((prev) => [...prev, tag]);
                  }}
                />
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-2 border-t border-gray-800 bg-[#111B21] px-4 py-3">
              <button
                className="flex-1 rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500"
                onClick={() => setShowTagModal(false)}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
