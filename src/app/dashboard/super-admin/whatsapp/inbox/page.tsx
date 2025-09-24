'use client';

import React, { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';

import { FileText, Image as ImageIcon, Mic, Paperclip, Send, Video } from 'lucide-react';

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

interface Thread {
  waid: string;
  name?: string | null;
  lastTs: number;
  lastText?: string;
  items: InboxItem[];
}

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
            width={500}   // ⚠️ requerido en next/image
            height={300}  // ⚠️ requerido en next/image
            className="max-h-72 rounded-lg"
          />          {caption}
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
    default:
      return (
        <div className="space-y-1">
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded bg-[#2A3942] text-gray-100 hover:bg-[#33434c] text-sm"
          >
            {item.fileName ?? 'Abrir documento'}
          </a>
          {caption}
          <a href={downloadHref} className="inline-flex items-center gap-1 text-xs underline">
            Descargar
          </a>
        </div>
      );
  }
}



export default function WhatsAppInboxPage() {
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [compose, setCompose] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showList, setShowList] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCaption, setFileCaption] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Agrupar por chat (wa_id)
  const threads = useMemo<Thread[]>(() => {
    const map = new Map<string, InboxItem[]>();
    for (const it of inbox) {
      const key = (it.from ?? it.to ?? 'unknown')!;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    const list: Thread[] = [];
    for (const [waid, items] of map.entries()) {
      const sorted = items.slice().sort((a, b) => a.timestamp - b.timestamp);
      const last = sorted[sorted.length - 1];
      const name =
        sorted.find((x) => x.name)?.name ??
        sorted.find((x) => x.from)?.from ??
        undefined;
      list.push({
        waid,
        name,
        lastTs: last?.timestamp ?? 0,
        lastText: last?.text ?? '',
        items: sorted,
      });
    }
    return list.sort((a, b) => b.lastTs - a.lastTs);
  }, [inbox]);

  // Selección inicial y persistencia
  useEffect(() => {
    const saved = localStorage.getItem('wa_selected_chat');
    if (saved) {
      setSelected(saved);
      setShowList(false);
    }
  }, []);

  useEffect(() => {
    if (!selected && threads.length) setSelected(threads[0].waid);
    if (selected) localStorage.setItem('wa_selected_chat', selected);
  }, [threads, selected]);

  // Carga + polling
  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        const res = await fetch('/api/super-admin/whatsapp/inbox', {
          cache: 'no-store',
        });
        const data = (await res.json()) as ApiInboxResponse;
        if (!cancel) setInbox(Array.isArray(data?.items) ? data.items : []);
      } catch {
        if (!cancel) setInbox([]);
      }
    };
    load();
    const iv = setInterval(load, 4000);
    return () => {
      cancel = true;
      clearInterval(iv);
    };
  }, []);

  // Autoscroll al final cuando cambian mensajes del chat activo
  const activeItems = useMemo(
    () => threads.find((t) => t.waid === (selected ?? ''))?.items ?? [],
    [threads, selected]
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 9999;
  }, [activeItems.length]);

  // Helpers UI
  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });

  const lastInboundId = (waid: string) =>
    threads
      .find((t) => t.waid === waid)
      ?.items.slice()
      .reverse()
      .find((m) => m.direction === 'inbound' && m.id)?.id;

  // Enviar archivo
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
        const errorData = await res.json();
        const errMsg = (errorData as { error?: string })?.error ?? 'Error enviando archivo';
        throw new Error(errMsg);
      }

      // Limpiar selección
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

  // Enviar texto
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

      // Optimista
      setInbox((prev) => [
        {
          id: 'local-' + Date.now(),
          direction: 'outbound',
          timestamp: Date.now(),
          to: waid,
          type: 'text',
          text,
        },
        ...prev,
      ]);
      setCompose((p) => ({ ...p, [waid]: '' }));
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'No se pudo enviar el WhatsApp';
      alert(msg);
    } finally {
      setSending(null);
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>, waid: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(waid);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 64MB para WhatsApp)
      const maxSize = 64 * 1024 * 1024; // 64MB
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

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (file.type.startsWith('audio/')) return <Mic className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="flex h-[calc(100vh-80px)] min-h-[560px] w-full overflow-hidden rounded-lg border border-gray-800 bg-[#0B141A]">
      {/* Sidebar chats (oscuro) */}
      <aside
        className={`w-full md:w-80 border-r border-gray-800 bg-[#111B21] text-gray-200 ${showList ? 'block' : 'hidden md:block'
          }`}
      >
        <div className="px-4 py-3 text-lg font-semibold text-gray-100">WhatsApp Inbox</div>
        <div className="max-h-[calc(100%-48px)] overflow-y-auto">
          {threads.length === 0 && (
            <div className="p-4 text-sm text-[#8696A0]">Sin conversaciones aún.</div>
          )}
          {threads.map((t) => (
            <button
              key={t.waid}
              onClick={() => {
                setSelected(t.waid);
                setShowList(false);
              }}
              className={`block w-full px-4 py-3 text-left transition-colors ${selected === t.waid ? 'bg-[#2A3942]' : 'hover:bg-[#202C33]'
                }`}
            >
              <div className="flex items-baseline justify-between">
                <div className="truncate font-medium text-gray-100">
                  {t.name ?? t.waid}
                  <span className="ml-2 text-xs text-[#8696A0]">({t.waid})</span>
                </div>
                <div className="ml-2 shrink-0 text-xs text-[#8696A0]">
                  {t.lastTs ? fmtTime(t.lastTs) : ''}
                </div>
              </div>
              <div className="mt-1 truncate text-sm text-[#8696A0]">
                {t.lastText ?? '(sin texto)'}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat window (oscuro) */}
      <section
        className={`flex min-w-0 flex-1 flex-col ${showList ? 'hidden md:flex' : 'flex'}`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-800 bg-[#202C33] px-5 py-3 text-gray-100">
          <button
            onClick={() => setShowList(true)}
            className="rounded px-2 py-1 text-sm hover:bg-white/10 md:hidden"
            aria-label="Volver a chats"
          >
            ← Chats
          </button>
          <div className="h-8 w-8 rounded-full bg-white/10" />
          <div className="min-w-0">
            <div className="truncate font-medium">
              {threads.find((t) => t.waid === selected)?.name ?? selected ?? '—'}
            </div>
            <div className="truncate text-xs text-[#8696A0]">
              {selected ? `(${selected})` : 'Selecciona una conversación'}
            </div>
          </div>
        </div>

        {/* Messages */}
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
              console.log('[UI] msg', { type: m.type, mediaId: m.mediaId, text: m.text, id: m.id });

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
                      : (m.text && <div className="whitespace-pre-wrap">{m.text}</div>)
                    }



                    <div
                      className={`mt-1 text-right text-[10px] ${isOutbound ? 'text-white/70' : 'text-[#8696A0]'
                        }`}
                    >
                      {fmtTime(m.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Composer */}
        <div className="border-t border-gray-800 bg-[#111B21] p-3 space-y-3">
          {/* Preview del archivo seleccionado */}
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

              {/* Caption para archivos multimedia */}
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

          {/* Input principal */}
          <div className="flex items-end gap-2">
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
              className="rounded-xl bg-[#202C33] p-2 text-[#8696A0] hover:bg-[#2A3942] disabled:opacity-50"
              title="Adjuntar archivo"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <textarea
              disabled={!selected}
              rows={1}
              onKeyDown={(e) => selected && handleKey(e, selected)}
              className="max-h-40 min-h-[44px] w-full resize-y rounded-xl border border-transparent bg-[#202C33] p-3 text-sm text-gray-100 placeholder-[#8696A0] focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
              placeholder={
                selected
                  ? 'Escribe un mensaje (Enter para enviar, Shift+Enter salto de línea)'
                  : 'Selecciona un chat…'
              }
              value={selected ? compose[selected] || '' : ''}
              onChange={(e) =>
                selected && setCompose((prev) => ({ ...prev, [selected]: e.target.value }))
              }
            />

            <button
              disabled={
                !selected || sending === selected || (!(compose[selected ?? ''] || '').trim() && !selectedFile)
              }
              onClick={() => selected && handleSend(selected)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {sending === selected ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}