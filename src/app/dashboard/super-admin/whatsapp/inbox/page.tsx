'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
    // más reciente primero
    return list.sort((a, b) => b.lastTs - a.lastTs);
  }, [inbox]);

  // ---- Selección inicial y persistencia ----
  useEffect(() => {
    const saved = localStorage.getItem('wa_selected_chat');
    if (saved) setSelected(saved);
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
      ?.items
      .slice()
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

          if (j && typeof j === 'object' && 'error' in j) {
            const maybe = (j as { error?: unknown }).error;
            if (typeof maybe === 'string' && maybe.trim()) {
              errMsg = maybe;
            }
          }
        } catch {
          // ignoramos parse errors y usamos el mensaje por defecto
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
      alert('No se pudo enviar el WhatsApp');
    } finally {
      setSending(null);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>, waid: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(waid);
    }
  };

  // ---- UI ----
  return (
    <div className="flex h-[calc(100vh-80px)] min-h-[560px] w-full gap-0 rounded-lg border border-gray-800 bg-gray-900">
      {/* Sidebar chats */}
      <aside className="w-80 border-r border-gray-800 bg-gray-950">
        <div className="px-4 py-3 text-lg font-semibold">WhatsApp Inbox</div>
        <div className="max-h-[calc(100%-48px)] overflow-y-auto">
          {threads.length === 0 && (
            <div className="p-4 text-sm text-gray-400">Sin conversaciones aún.</div>
          )}
          {threads.map((t) => (
            <button
              key={t.waid}
              onClick={() => setSelected(t.waid)}
              className={`block w-full px-4 py-3 text-left hover:bg-gray-800/60 ${selected === t.waid ? 'bg-gray-800' : ''
                }`}
            >
              <div className="flex items-baseline justify-between">
                <div className="truncate font-medium">
                  {t.name ?? t.waid}
                  <span className="ml-2 text-xs text-gray-400">({t.waid})</span>
                </div>
                <div className="ml-2 shrink-0 text-xs text-gray-400">
                  {t.lastTs ? fmtTime(t.lastTs) : ''}
                </div>
              </div>
              <div className="mt-1 truncate text-sm text-gray-400">
                {t.lastText ?? '(sin texto)'}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat window */}
      <section className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-800 px-5 py-3">
          <div className="h-8 w-8 rounded-full bg-emerald-700/40" />
          <div className="min-w-0">
            <div className="truncate font-medium">
              {threads.find((t) => t.waid === selected)?.name ?? selected ?? '—'}
            </div>
            <div className="truncate text-xs text-gray-400">
              {selected ? `(${selected})` : 'Selecciona una conversación'}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-2 overflow-y-auto bg-[url('https://i.imgur.com/dYcYQ7E.png')] bg-cover p-4"
        >
          {!selected && (
            <div className="p-6 text-center text-sm text-gray-400">
              Selecciona un chat para comenzar.
            </div>
          )}

          {selected &&
            activeItems.map((m) => {
              if (m.direction === 'status') {
                return (
                  <div
                    key={m.id ?? String(m.timestamp)}
                    className="mx-auto w-fit max-w-[70%] rounded-full bg-gray-800/70 px-3 py-1 text-center text-xs text-gray-300"
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
                    className={`max-w-[75%] rounded-2xl px-3 py-2 shadow ${isOutbound
                      ? 'rounded-br-sm bg-emerald-600 text-white'
                      : 'rounded-bl-sm bg-gray-800 text-gray-100'
                      }`}
                    title={m.id ? `id: ${m.id}` : ''}
                  >
                    {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}
                    <div
                      className={`mt-1 text-[10px] ${isOutbound ? 'text-emerald-100/80' : 'text-gray-300/70'
                        } text-right`}
                    >
                      {fmtTime(m.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Composer */}
        <div className="border-t border-gray-800 p-3">
          <div className="flex items-end gap-2">
            <textarea
              disabled={!selected}
              rows={1}
              onKeyDown={(e) => selected && handleKey(e, selected)}
              className="max-h-40 min-h-[44px] w-full resize-y rounded-xl border border-gray-700 bg-gray-900 p-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
              placeholder={
                selected ? 'Escribe un mensaje (Enter para enviar, Shift+Enter salto de línea)' : 'Selecciona un chat…'
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
