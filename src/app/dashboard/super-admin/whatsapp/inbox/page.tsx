'use client';

import React, { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';

import { FileText, Image as ImageIcon, Mic, Paperclip, Send, Video } from 'lucide-react';

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
interface ApiError { error: string }

interface CreateTagOk { tag: Tag }
type CreateTagResp = CreateTagOk | ApiError;

interface TagsOk { tags: Tag[] }
type TagsResp = TagsOk | ApiError;

interface AssignedOk { assignedTagIds: number[] }
type AssignedResp = AssignedOk | ApiError;

function isApiError(x: unknown): x is ApiError {
  return typeof x === 'object'
    && x !== null
    && 'error' in x
    && typeof (x as Record<string, unknown>).error === 'string';
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
  return typeof x === 'object' && x !== null && Array.isArray((x as Record<string, unknown>).assignedTagIds);
}
/* ========================================================== */

function MediaMessage({ item }: { item: InboxItem }) {
  if (!item.mediaId) {
    return item.text ? <div className="whitespace-pre-wrap">{item.text}</div> : null;
  }

  const src = `/api/super-admin/whatsapp/media?id=${encodeURIComponent(item.mediaId)}`;
  const downloadHref = `${src}&action=download`;
  const caption = item.text ? <div className="mt-1 text-sm whitespace-pre-wrap">{item.text}</div> : null;

  switch ((item.type || '').toLowerCase()) {
    case 'image':
      return (
        <div className="space-y-1">
          <Image
            src={src}
            alt={item.fileName ?? "Imagen"}
            width={500}
            height={300}
            className="max-h-72 rounded-lg"
          />
          {caption}
          <a href={downloadHref} className="inline-flex items-center gap-1 text-xs underline">
            Descargar
          </a>
        </div>
      );
    case 'video':
      return (
        <div className="space-y-1">
          <video src={src} controls className="max-h-72 rounded-lg" />
          {caption}
          <a href={downloadHref} className="inline-flex items-center gap-1 text-xs underline">
            Descargar
          </a>
        </div>
      );
    case 'audio':
      return (
        <div className="space-y-1">
          <audio src={src} controls className="w-64" />
          {caption}
          <a href={downloadHref} className="inline-flex items-center gap-1 text-xs underline">
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
        const msg = isApiError(j) ? j.error ?? 'Error creando etiqueta' : 'Error creando etiqueta';
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
        className="flex-1 rounded bg-[#2A3942] px-3 py-2 text-sm text-gray-100 placeholder-[#8696A0] border-0 focus:outline-none focus:ring-1 focus:ring-emerald-600"
      />
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-9 w-10 rounded border-0 bg-transparent cursor-pointer"
        title="Color"
      />
      <button
        onClick={create}
        disabled={saving || !name.trim()}
        className="rounded bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-50 hover:bg-emerald-500"
      >
        {saving ? '...' : 'Crear'}
      </button>
    </div>
  );
}

export default function WhatsAppInboxPage({ searchParams }: WhatsAppInboxPageProps) {
  const session = searchParams.session ?? 'soporte'; const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [compose, setCompose] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showList, setShowList] = useState<boolean>(true);
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
  const [tagAssignmentsCache, setTagAssignmentsCache] = useState<Record<string, number[]>>({});

  // Configuración de la sesión actual
  const sessionName = session;

  const getInitialHiddenWaids = (): Set<string> => {
    try {
      if (typeof window === 'undefined') return new Set();
      const saved = sessionStorage.getItem('wa_hidden_chats');
      if (!saved) return new Set();
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.every((v): v is string => typeof v === 'string')) {
        return new Set(parsed);
      }
      return new Set();
    } catch {
      return new Set();
    }
  };

  const [hiddenWaids, setHiddenWaids] = useState<Set<string>>(getInitialHiddenWaids);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('wa_hidden_chats', JSON.stringify(Array.from(hiddenWaids)));
  }, [hiddenWaids]);

  const [filterName, setFilterName] = useState('');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [filterHours, setFilterHours] = useState<string>('');
  const [filterWindow, setFilterWindow] = useState<'all' | 'active24' | 'almost' | 'expired'>('all');

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

      const lastInbound = sorted.slice().reverse().find((msg) => msg.direction === 'inbound');
      const lastInboundTs = lastInbound?.timestamp ?? 0;

      const firstTs = first?.timestamp ?? 0;
      const elapsed = lastInboundTs ? now - lastInboundTs : Number.POSITIVE_INFINITY;
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

  const waidsKey = useMemo(() => threads.map(t => t.waid).sort().join(','), [threads]);

  useEffect(() => {
    if (!waidsKey) return;
    let cancel = false;

    (async () => {
      const waids = waidsKey.split(',').filter(Boolean);
      for (const waid of waids) {
        if ((tagAssignmentsCache[waid] ?? undefined) !== undefined) continue;

        try {
          const r = await fetch(`/api/super-admin/whatsapp/inbox/tags?waid=${encodeURIComponent(waid)}`, { cache: 'no-store' });
          const j = (await r.json()) as unknown as AssignedResp;
          const ids = isAssignedOk(j) ? j.assignedTagIds : [];
          if (!cancel) {
            setTagAssignmentsCache(prev => ({ ...prev, [waid]: ids }));
          }
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`wa_tagmap_${waid}`, JSON.stringify(ids));
          }
        } catch {
          if (!cancel) {
            setTagAssignmentsCache(prev => ({ ...prev, [waid]: [] }));
          }
        }
      }
    })();

    return () => { cancel = true; };
  }, [waidsKey, tagAssignmentsCache]);

  const filteredThreads = useMemo(() => {
    const name = filterName.trim().toLowerCase();
    const fromMs = filterFrom ? new Date(filterFrom).setHours(0, 0, 0, 0) : null;
    const toMs = filterTo ? new Date(filterTo).setHours(23, 59, 59, 999) : null;
    const withinHours = filterHours ? Number(filterHours) : null;
    const now = Date.now();

    return threads.filter((t) => {
      if (hiddenWaids.has(t.waid)) return false;
      if (name && !(`${t.name ?? ''} ${t.waid}`.toLowerCase().includes(name))) return false;
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
          } catch { /* ignore */ }
        }

        if (!Array.isArray(ids) || !ids.includes(tagFilter as number)) {
          return false;
        }
      }

      return true;
    });
  }, [threads, filterName, filterFrom, filterTo, filterHours, filterWindow, hiddenWaids, tagFilter, tagAssignmentsCache]);

  useEffect(() => {
    const saved = sessionStorage.getItem('wa_selected_chat');
    if (saved) {
      setSelected(saved);
      setShowList(false);
    }
  }, []);

  useEffect(() => {
    if (!selected && threads.length) setSelected(threads[0].waid);
    if (selected) sessionStorage.setItem('wa_selected_chat', selected);
  }, [threads, selected]);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/super-admin/whatsapp/inbox?session=${sessionName}`, {
          cache: 'no-store',
        });
        const data = (await res.json()) as ApiInboxResponse;
        if (!cancel) {
          const serverItems = Array.isArray(data?.items) ? data.items : [];

          setInbox((prevInbox) => {
            // Obtener mensajes locales (los que tienen id local-...)
            const localMessages = prevInbox.filter((m) => m.id?.startsWith('local-'));

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
                  Math.abs((server.timestamp || 0) - (local.timestamp || 0)) < 15000
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
        const r = await fetch('/api/super-admin/whatsapp/tags', { cache: 'no-store' });
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
        const r = await fetch(`/api/super-admin/whatsapp/inbox/tags?waid=${encodeURIComponent(waid)}`, { cache: 'no-store' });
        const j = (await r.json()) as unknown as AssignedResp;
        const ids = isAssignedOk(j) ? j.assignedTagIds : [];
        setAssignedTagIds(ids);
        setTagAssignmentsCache(prev => ({ ...prev, [waid]: ids }));
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
      if (fileCaption) {
        formData.append('caption', fileCaption);
      }

      const res = await fetch('/api/super-admin/whatsapp/media', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as ApiError | Record<string, unknown>;
        const errMsg = isApiError(errorData) ? errorData.error ?? 'Error enviando archivo' : 'Error enviando archivo';
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
      alert('Error al enviar el archivo: ' + (error instanceof Error ? error.message : 'Error desconocido'));
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
      const msg = e instanceof Error ? e.message : 'No se pudo enviar el WhatsApp';
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

      const res = await fetch(`/api/super-admin/whatsapp?session=${sessionName}`, { method: 'GET' });
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
      void handleSend(waid);
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
      const remaining = filteredThreads.filter(t => t.waid !== waid);
      setSelected(remaining[0]?.waid ?? null);
    }
  };

  const restoreAllConversations = () => {
    setHiddenWaids(new Set());
    sessionStorage.removeItem('wa_hidden_chats');
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (file.type.startsWith('audio/')) return <Mic className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="flex h-[calc(100vh-80px)] min-h-[560px] w-full overflow-hidden rounded-lg border border-gray-800 bg-[#0B141A]">
      <aside
        className={`w-full md:w-80 border-r border-gray-800 bg-[#111B21] text-gray-200 ${showList ? 'block' : 'hidden md:block'}`}
      >
        <div className="px-4 py-4 flex items-center justify-between bg-[#202C33]">
          <div className="text-xl font-semibold text-gray-100">Chats</div>
          {hiddenWaids.size > 0 && (
            <button
              onClick={restoreAllConversations}
              className="text-xs text-emerald-400 hover:text-emerald-300"
              title={`Restaurar ${hiddenWaids.size} conversación(es) oculta(s)`}
            >
              ({hiddenWaids.size})
            </button>
          )}
        </div>

        <div className="px-4 pb-3 pt-1 space-y-2 text-xs text-[#8696A0] border-b border-gray-800">
          <input
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Buscar por nombre o WAID"
            className="w-full rounded bg-[#202C33] px-3 py-2 text-gray-100 placeholder-[#8696A0] border-0 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="rounded bg-[#202C33] px-2 py-2 text-gray-100 border-0 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              title="Desde (fecha)"
            />
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="rounded bg-[#202C33] px-2 py-2 text-gray-100 border-0 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              title="Hasta (fecha)"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              value={filterHours}
              onChange={(e) => setFilterHours(e.target.value)}
              placeholder="Últimas (h)"
              className="rounded bg-[#202C33] px-2 py-2 text-gray-100 placeholder-[#8696A0] border-0 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              title="Filtrar por últimas N horas"
            />
            <select
              value={filterWindow}
              onChange={(e) => setFilterWindow(e.target.value as typeof filterWindow)}
              className="rounded bg-[#202C33] px-2 py-2 text-gray-100 border-0 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              title="Estado de ventana 24h"
            >
              <option value="all">Todos</option>
              <option value="active24">Activos (≤24h)</option>
              <option value="almost">Falta poco (≤2h)</option>
              <option value="expired">Expirados (&gt;24h)</option>
            </select>
          </div>

          <select
            value={tagFilter === 'ALL' ? 'ALL' : String(tagFilter)}
            onChange={(e) => {
              const v = e.target.value;
              setTagFilter(v === 'ALL' ? 'ALL' : Number(v));
            }}
            className="w-full rounded bg-[#202C33] px-2 py-2 text-gray-100 border-0 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            title="Filtrar por etiqueta"
          >
            <option value="ALL">Todas las etiquetas</option>
            {allTags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="max-h-[calc(100%-180px)] overflow-y-auto">
          {filteredThreads.length === 0 && (
            <div className="p-4 text-sm text-[#8696A0]">Sin conversaciones que coincidan con el filtro.</div>
          )}
          {filteredThreads.map((t) => (
            <div
              key={t.waid}
              className={`group relative flex w-full border-b border-gray-800/50 transition-colors ${selected === t.waid ? 'bg-[#2A3942]' : 'hover:bg-[#202C33]'}`}
            >
              <button
                onClick={() => {
                  setSelected(t.waid);
                  setShowList(false);
                }}
                className="flex-1 px-3 md:px-4 py-3 text-left flex items-center gap-3"
              >
                {/* Avatar circular */}
                <div className="h-12 w-12 md:h-10 md:w-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-lg md:text-base flex-shrink-0">
                  {(t.name ?? t.waid).charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header con nombre y hora */}
                  <div className="flex items-baseline justify-between mb-0.5">
                    <div className="truncate font-medium text-gray-100 text-base md:text-sm">
                      {t.name ?? t.waid}
                    </div>
                    <div className="ml-2 shrink-0 text-xs text-[#8696A0]">
                      {t.lastTs ? fmtTime(t.lastTs) : ''}
                    </div>
                  </div>

                  {/* Último mensaje */}
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm text-[#8696A0] flex-1">
                      {t.lastText ?? '(sin texto)'}
                    </div>
                    {/* Badge de estado (solo móvil) */}
                    <div className="md:hidden shrink-0">
                      {t.isNew24h ? (
                        t.isAlmostExpired ? (
                          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" title="Casi expira" />
                        ) : (
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" title="Activo" />
                        )
                      ) : (
                        <span className="inline-block h-2 w-2 rounded-full bg-gray-500" title="Expirado" />
                      )}
                    </div>
                  </div>

                  {/* Etiquetas compactas */}
                  <div className="flex mt-1 flex-wrap gap-1">
                    {(tagAssignmentsCache[t.waid] ?? []).map((id) => {
                      const tag = allTags.find((x) => x.id === id);
                      if (!tag) return null;
                      return (
                        <span
                          key={`${t.waid}-tag-${id}`}
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px]"
                          style={{
                            background: (tag.color ?? '#202C33') + '20',
                            color: tag.color ?? '#cbd5e1',
                          }}
                        >
                          ● {tag.name}
                        </span>
                      );
                    })}
                  </div>

                  {/* Estado de ventana (solo desktop) */}
                  <div className="hidden md:flex mt-1 items-center gap-2">
                    {t.isNew24h ? (
                      t.isAlmostExpired ? (
                        <span className="text-[10px] text-amber-400">
                          ⏳ {fmtDuration(t.remainingMs)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400">
                          🚀 {fmtDuration(t.remainingMs)}
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-gray-500">🕒 Expirado</span>
                    )}
                  </div>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`¿Ocultar conversación con ${t.name ?? t.waid}?`)) {
                    hideConversation(t.waid);
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 md:group-hover:opacity-100 transition-opacity rounded-full p-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300"
                title="Ocultar conversación"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className={`flex min-w-0 flex-1 flex-col ${showList ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex items-center gap-3 border-b border-gray-800 bg-[#202C33] px-3 md:px-5 py-2.5 md:py-3 text-gray-100">
          <button
            onClick={() => setShowList(true)}
            className="md:hidden -ml-1 p-2 hover:bg-white/10 rounded-full"
            aria-label="Volver a chats"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="h-10 w-10 md:h-8 md:w-8 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-lg md:text-base flex-shrink-0">
            {selected ? (threads.find((t) => t.waid === selected)?.name ?? selected ?? '—').charAt(0).toUpperCase() : '—'}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">
              {threads.find((t) => t.waid === selected)?.name ?? selected ?? '—'}
            </div>
            <div className="truncate text-xs text-[#8696A0]">
              {selected ? `(${selected})` : 'Selecciona una conversación'}
            </div>
            {selected && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {assignedTagIds.length === 0 && (
                  <span className="text-[11px] text-[#8696A0]">Sin etiquetas</span>
                )}
                {assignedTagIds.map((id) => {
                  const t = allTags.find((x) => x.id === id);
                  if (!t) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                      style={{
                        background: (t.color ?? '#202C33') + '20',
                        color: t.color ?? '#cbd5e1',
                        border: '1px solid ' + (t.color ?? '#334155'),
                      }}
                    >
                      ● {t.name}
                    </span>
                  );
                })}
                <button
                  onClick={() => setShowTagModal(true)}
                  className="rounded border border-emerald-700/40 bg-emerald-600/10 px-2 py-0.5 text-xs text-emerald-300 hover:bg-emerald-600/20"
                >
                  Etiquetas…
                </button>
              </div>
            )}

            {selected && (() => {
              const t = threads.find(x => x.waid === selected);
              if (!t) return null;
              return (
                <div className="mt-1">
                  {t.isNew24h ? (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.isAlmostExpired ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-600/20 text-emerald-400'}`}>
                      {t.isAlmostExpired ? `⏳ Queda ${fmtDuration(t.remainingMs)}` : `🚀 Activo — ${fmtDuration(t.remainingMs)} restantes`}
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-500/20 px-2 py-0.5 text-[10px] font-medium text-gray-400">🕒 Ventana expirada</span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-2 overflow-y-auto p-4"
          style={{
            backgroundImage: "url('/wallWhat.png')",
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#0B141A',
          }}
        >
          {!selected && (
            <div className="p-6 text-center text-sm text-[#8696A0]">
              Selecciona un chat para comenzar.
            </div>
          )}

          {selected &&
            activeItems.map((m) => {
              if (m.direction === 'status') {
                return (
                  <div
                    key={m.id ?? String(m.timestamp)}
                    className="mx-auto w-fit max-w-[70%] rounded-full bg-[#202C33] px-3 py-1 text-center text-xs text-gray-200"
                    title={m.id ? `id: ${m.id}` : ''}
                  >
                    {m.text} · {fmtTime(m.timestamp)}
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
                    className={`max-w-[80%] rounded-2xl px-3 py-2 shadow ${isOutbound
                      ? 'rounded-br-sm bg-[#005C4B] text-white'
                      : 'rounded-bl-sm bg-[#202C33] text-gray-100'
                      }`}
                    title={m.id ? `id: ${m.id}` : ''}
                  >
                    {(m.mediaId && ['image', 'video', 'audio', 'document'].includes((m.type || '').toLowerCase()))
                      ? <MediaMessage item={m} />
                      : m.type === 'template'
                        ? (
                          <div>
                            <div className="text-xs text-white/70 mb-1 italic">📋 Plantilla</div>
                            <div className="whitespace-pre-wrap">{m.text}</div>
                          </div>
                        )
                        : (m.text && <div className="whitespace-pre-wrap">{m.text}</div>)
                    }

                    <div
                      className={`mt-1 text-right text-[10px] ${isOutbound ? 'text-white/70' : 'text-[#8696A0]'}`}
                    >
                      {fmtTime(m.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="border-t border-gray-800 bg-[#202C33] p-2 md:p-3 space-y-2 md:space-y-3">
          {selectedFile && (
            <div className="bg-[#202C33] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile)}
                  <span className="text-sm text-gray-200">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-[#8696A0]">
                    ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <button
                  onClick={removeSelectedFile}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  ✕
                </button>
              </div>

              {(selectedFile.type.startsWith('image/') ||
                selectedFile.type.startsWith('video/') ||
                selectedFile.type.startsWith('document/')) && (
                  <input
                    type="text"
                    placeholder="Añadir un pie de foto (opcional)"
                    value={fileCaption}
                    onChange={(e) => setFileCaption(e.target.value)}
                    className="w-full bg-[#2A3942] text-gray-100 placeholder-[#8696A0] rounded px-3 py-2 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => selected && handleFileUpload(selected)}
                  disabled={uploadingFile || !selected}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-sm text-white flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {uploadingFile ? 'Enviando...' : 'Enviar archivo'}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-end gap-1.5 md:gap-2">
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
              className="rounded-full bg-[#2A3942] p-2.5 md:p-2 text-[#8696A0] hover:bg-[#374854] disabled:opacity-50 flex-shrink-0"
              title="Adjuntar archivo"
            >
              <Paperclip className="h-5 w-5 md:h-5 md:w-5" />
            </button>

            <div className="flex-1 flex items-center gap-1.5 md:gap-2 bg-[#2A3942] rounded-full px-4 md:px-3 py-1.5 md:py-2">
              <textarea
                disabled={!selected}
                rows={1}
                onKeyDown={(e) => selected && handleKey(e, selected)}
                className="max-h-32 min-h-[36px] md:min-h-[44px] w-full resize-none bg-transparent text-sm md:text-sm text-gray-100 placeholder-[#8696A0] focus:outline-none disabled:opacity-50 py-1.5"
                placeholder={selected ? 'Mensaje' : 'Selecciona un chat…'}
                value={selected ? compose[selected] || '' : ''}
                onChange={(e) =>
                  selected && setCompose((prev) => ({ ...prev, [selected]: e.target.value }))
                }
                style={{ scrollbarWidth: 'none' }}
              />
            </div>

            <button
              disabled={
                !selected || sending === selected || (!(compose[selected ?? ''] || '').trim() && !selectedFile)
              }
              onClick={() => {
                if (!selected) return;
                const t = threads.find((x) => x.waid === selected);
                if (t && !t.isNew24h) {
                  void openTemplatePicker();
                } else {
                  void handleSend(selected);
                }
              }}
              className="rounded-full bg-[#25D366] p-3 md:p-2.5 text-white shadow-lg hover:bg-[#20BA5A] disabled:opacity-50 disabled:bg-[#2A3942] flex-shrink-0"
            >
              <Send className="h-5 w-5 md:h-4 md:w-4" />
            </button>
          </div>
        </div>
      </section>

      {showTplModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg rounded-lg bg-[#111B21] text-gray-100 shadow-lg border border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold">Selecciona una plantilla para abrir la conversación</h3>
              <button onClick={() => setShowTplModal(false)} className="text-[#8696A0] hover:text-gray-200">✕</button>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {tplLoading && <div className="text-sm text-[#8696A0]">Cargando plantillas…</div>}
              {tplError && <div className="text-sm text-red-400">{tplError}</div>}
              {!tplLoading && !tplError && templates.length === 0 && (
                <div className="text-sm text-[#8696A0]">No hay plantillas disponibles.</div>
              )}

              {!tplLoading && templates.map((tpl) => (
                <label key={tpl.name + tpl.langCode} className="flex items-start gap-3 rounded-lg bg-[#202C33] p-3 hover:bg-[#2A3942] cursor-pointer">
                  <input
                    type="radio"
                    name="tpl"
                    checked={tplSelected?.name === tpl.name && tplSelected?.langCode === tpl.langCode}
                    onChange={() => setTplSelected(tpl)}
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {tpl.label} <span className="text-xs text-[#8696A0]">({tpl.langCode})</span>
                    </div>
                    {tpl.body && <div className="mt-1 text-xs text-[#cbd5e1] whitespace-pre-wrap">{tpl.body}</div>}
                    {tpl.example?.length ? (
                      <div className="mt-1 text-[11px] text-[#94a3b8]">Ejemplo: {tpl.example.join(' · ')}</div>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-800">
              <button
                className="rounded px-4 py-2 bg-[#202C33] hover:bg-[#2A3942] text-[#e5e7eb]"
                onClick={() => setShowTplModal(false)}
              >
                Cancelar
              </button>
              <button
                className="rounded px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                disabled={!tplSelected || !selected || sending === selected}
                onClick={() => selected && sendWithTemplateThenText(selected)}
              >
                Usar plantilla y enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {showTagModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg bg-[#111B21] text-gray-100 shadow-lg border border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold">Etiquetas para {selected}</h3>
              <button onClick={() => setShowTagModal(false)} className="text-[#8696A0] hover:text-gray-200">✕</button>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="text-xs text-[#94a3b8]">Marca/desmarca para asignar o quitar.</div>

              {allTags.length === 0 && (
                <div className="text-sm text-[#8696A0]">No hay etiquetas aún.</div>
              )}

              {allTags.map((t) => {
                const checked = assignedTagIds.includes(t.id);
                return (
                  <label key={t.id} className="flex items-center gap-3 rounded-lg bg-[#202C33] p-3 hover:bg-[#2A3942] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={async (e) => {
                        try {
                          if (e.target.checked) {
                            await fetch('/api/super-admin/whatsapp/inbox/tags', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ waid: selected, tagId: t.id }),
                            });
                            const newIds = [...new Set([...assignedTagIds, t.id])];
                            setAssignedTagIds(newIds);
                            setTagAssignmentsCache(prev => ({ ...prev, [selected]: newIds }));
                          } else {
                            await fetch('/api/super-admin/whatsapp/inbox/tags', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ waid: selected, tagId: t.id }),
                            });
                            const newIds = assignedTagIds.filter((x) => x !== t.id);
                            setAssignedTagIds(newIds);
                            setTagAssignmentsCache(prev => ({ ...prev, [selected]: newIds }));
                          }
                        } catch {
                          alert('No se pudo actualizar la etiqueta');
                        }
                      }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ background: t.color ?? '#22c55e' }}
                        />
                        {t.name}
                      </div>
                    </div>
                  </label>
                );
              })}

              <div className="mt-4 rounded-lg bg-[#202C33] p-3">
                <div className="text-xs text-[#94a3b8] mb-2">Crear nueva etiqueta:</div>
                <CreateQuickTag
                  onCreated={(tag) => {
                    setAllTags((prev) => [...prev, tag]);
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-800">
              <button
                className="rounded px-4 py-2 bg-emerald-600 hover:bg-emerald-500"
                onClick={() => setShowTagModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}