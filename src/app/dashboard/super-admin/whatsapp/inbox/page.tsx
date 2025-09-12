'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { KeyboardEvent } from 'react';

interface InboxItem {
  id?: string;
  from?: string;
  to?: string;
  name?: string | null;
  timestamp: number;
  type: string;
  text?: string;
  direction: 'inbound' | 'outbound' | 'status';
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

export default function WhatsAppInboxPage() {
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [compose, setCompose] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // móvil: mostrar lista (true) o chat (false)
  const [showList, setShowList] = useState<boolean>(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // ---- Agrupar por chat (wa_id) ----
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

  // ---- Selección inicial y persistencia ----
  useEffect(() => {
    const saved = localStorage.getItem('wa_selected_chat');
    if (saved) {
      setSelected(saved);
      setShowList(false); // si había uno seleccionado, abre chat en móvil
    }
  }, []);
  useEffect(() => {
    if (!selected && threads.length) setSelected(threads[0].waid);
    if (selected) localStorage.setItem('wa_selected_chat', selected);
  }, [threads, selected]);

  // ---- Carga + polling ----
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

  // ---- Autoscroll al final cuando cambian mensajes del chat activo ----
  const activeItems = useMemo(
    () => threads.find((t) => t.waid === (selected ?? ''))?.items ?? [],
    [threads, selected]
  );
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 9999;
  }, [activeItems.length]);

  // ---- Helpers UI ----
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

  // ---- Enviar ----
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

  // ---- UI ----
  return (
    <div className="flex h-[calc(100vh-80px)] min-h-[560px] w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Sidebar chats */}
      <aside
        className={`w-full md:w-80 border-r border-gray-200 bg-white ${showList ? 'block' : 'hidden md:block'
          }`}
      >
        <div className="px-4 py-3 text-lg font-semibold text-gray-800">WhatsApp Inbox</div>
        <div className="max-h-[calc(100%-48px)] overflow-y-auto">
          {threads.length === 0 && (
            <div className="p-4 text-sm text-gray-500">Sin conversaciones aún.</div>
          )}
          {threads.map((t) => (
            <button
              key={t.waid}
              onClick={() => {
                setSelected(t.waid);
                setShowList(false); // en móvil, al elegir chat, mostramos la conversación
              }}
              className={`block w-full px-4 py-3 text-left hover:bg-gray-50 ${selected === t.waid ? 'bg-gray-100' : ''
                }`}
            >
              <div className="flex items-baseline justify-between">
                <div className="truncate font-medium text-gray-900">
                  {t.name ?? t.waid}
                  <span className="ml-2 text-xs text-gray-500">({t.waid})</span>
                </div>
                <div className="ml-2 shrink-0 text-xs text-gray-500">
                  {t.lastTs ? fmtTime(t.lastTs) : ''}
                </div>
              </div>
              <div className="mt-1 truncate text-sm text-gray-500">
                {t.lastText ?? '(sin texto)'}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat window */}
      <section
        className={`flex min-w-0 flex-1 flex-col ${showList ? 'hidden md:flex' : 'flex'}`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 bg-[#075E54] text-white">
          {/* Back on mobile */}
          <button
            onClick={() => setShowList(true)}
            className="md:hidden rounded px-2 py-1 text-sm hover:bg-white/10"
            aria-label="Volver a chats"
          >
            ← Chats
          </button>
          <div className="h-8 w-8 rounded-full bg-white/20" />
          <div className="min-w-0">
            <div className="truncate font-medium">
              {threads.find((t) => t.waid === selected)?.name ?? selected ?? '—'}
            </div>
            <div className="truncate text-xs opacity-90">
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
            backgroundRepeat: 'no-repeat',  // si tu imagen es wallpaper grande
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#ECE5DD',     // color base de WhatsApp (fallback)
          }}
        >
          {!selected && (
            <div className="p-6 text-center text-sm text-gray-500">
              Selecciona un chat para comenzar.
            </div>
          )}

          {selected &&
            activeItems.map((m) => {
              if (m.direction === 'status') {
                return (
                  <div
                    key={m.id ?? String(m.timestamp)}
                    className="mx-auto w-fit max-w-[70%] rounded-full bg-gray-100 px-3 py-1 text-center text-xs text-gray-600"
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
                    className={`max-w-[80%] rounded-2xl px-3 py-2 shadow border ${isOutbound
                      ? 'rounded-br-sm bg-[#DCF8C6] border-green-200 text-gray-900' // enviado (verde WhatsApp)
                      : 'rounded-bl-sm bg-white border-gray-200 text-gray-900' // recibido (blanco)
                      }`}
                    title={m.id ? `id: ${m.id}` : ''}
                  >
                    {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}
                    <div className="mt-1 text-right text-[10px] text-gray-500">
                      {fmtTime(m.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Composer */}
        <div className="border-t border-gray-200 bg-white p-3">
          <div className="flex items-end gap-2">
            <textarea
              disabled={!selected}
              rows={1}
              onKeyDown={(e) => selected && handleKey(e, selected)}
              className="max-h-40 min-h-[44px] w-full resize-y rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
              placeholder={
                selected
                  ? 'Escribe un mensaje (Enter para enviar, Shift+Enter salto de línea)'
                  : 'Selecciona un chat…'
              }
              value={selected ? compose[selected] || '' : ''}
              onChange={(e) =>
                selected &&
                setCompose((prev) => ({ ...prev, [selected]: e.target.value }))
              }
            />
            <button
              disabled={
                !selected || sending === selected || !(compose[selected ?? ''] || '').trim()
              }
              onClick={() => selected && handleSend(selected)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-700 disabled:opacity-50"
            >
              {sending === selected ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
