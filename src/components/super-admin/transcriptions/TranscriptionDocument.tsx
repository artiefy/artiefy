'use client';

/**
 * Muestra la transcripción de un video como documento de estudio.
 *
 * En vez del volcado con marcas de tiempo (que sirve para buscar un momento
 * del video, no para leer), se renderiza la versión que la IA reorganizó en
 * secciones, listas y bloques de código.
 */

import { useCallback, useEffect, useState } from 'react';

import { FileText, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

export type ContentType =
  'lesson' | 'meeting' | 'project' | 'objective' | 'activity';

interface FormatResponse {
  hasTranscription?: boolean;
  hasFormatted?: boolean;
  markdown?: string;
  generatedAt?: string;
  segments?: number;
  error?: string;
  details?: string;
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-6 mb-4 border-b border-white/10 pb-3 text-2xl font-bold text-white first:mt-0 md:text-3xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 mb-3 text-xl font-bold text-white">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 text-lg font-semibold text-[#22C4D3]">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 leading-relaxed text-white/80">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1.5 pl-6 text-white/80">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-1.5 pl-6 text-white/80">
      {children}
    </ol>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-4 border-l-2 border-[#22C4D3]/50 pl-4 text-white/60 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-white/10" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#22C4D3] underline hover:text-[#6cecf4]"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className ?? '');
    const texto = String(children).replace(/\n$/, '');

    // Sin lenguaje y en una sola línea = código inline dentro de un párrafo.
    if (!match && !texto.includes('\n')) {
      return (
        <code
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-[#6cecf4]"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="mb-4 overflow-hidden rounded-xl border border-white/10">
        <SyntaxHighlighter
          language={match?.[1] ?? 'text'}
          style={atomOneDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'rgba(255,255,255,0.03)',
            fontSize: '0.85rem',
          }}
        >
          {texto}
        </SyntaxHighlighter>
      </div>
    );
  },
};

export function TranscriptionDocument({
  type,
  contentId,
}: {
  type: ContentType;
  contentId: number;
}) {
  const [doc, setDoc] = useState<FormatResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/super-admin/transcriptions/format?type=${type}&contentId=${contentId}`
      );
      if (res.ok) setDoc((await res.json()) as FormatResponse);
    } catch {
      // Silencioso: es la carga inicial del estado.
    } finally {
      setIsLoading(false);
    }
  }, [type, contentId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Si ya hay transcripción pero todavía no está organizada, se genera sola.
  // El resultado queda cacheado en Redis, así que esto ocurre una única vez
  // por video y las visitas siguientes lo leen directo.
  useEffect(() => {
    if (isLoading || isGenerating) return;
    if (doc?.hasTranscription && !doc.hasFormatted) {
      void generate();
    }
    // `generate` se recrea en cada render; incluirla reiniciaría el efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, doc?.hasTranscription, doc?.hasFormatted]);

  const generate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/super-admin/transcriptions/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, contentId }),
      });

      const data = (await res.json()) as FormatResponse;
      if (!res.ok) {
        throw new Error(data.details ?? data.error ?? 'Error desconocido');
      }

      setDoc({ ...data, hasFormatted: true, hasTranscription: true });
      toast.success('Documento generado');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error generando el documento'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-white/50">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Cargando transcripción...</span>
      </div>
    );
  }

  if (!doc?.hasTranscription) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
        <FileText className="mx-auto mb-3 size-8 text-white/30" />
        <p className="text-sm text-white/60">
          Este video todavía no tiene transcripción.
        </p>
        <p className="mt-1 text-xs text-white/40">
          Usa el botón &quot;Transcribir instrucción&quot; de arriba y volvé
          cuando termine.
        </p>
      </div>
    );
  }

  if (!doc.hasFormatted) {
    return (
      <div className="rounded-xl border border-[#22C4D3]/30 bg-[#22C4D3]/5 p-8 text-center">
        <Sparkles className="mx-auto mb-3 size-8 animate-pulse text-[#22C4D3]" />
        <p className="mb-1 text-sm text-white/80">
          Organizando la transcripción...
        </p>
        <p className="text-xs text-white/50">
          Se hace una sola vez por video. Tarda unos segundos.
        </p>
      </div>
    );
  }

  return (
    <div>
      <article className="max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {doc.markdown ?? ''}
        </ReactMarkdown>
      </article>
    </div>
  );
}
