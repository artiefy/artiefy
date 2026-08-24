'use client';

import { useState } from 'react';

import { Check, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/** How long the copy button stays confirmed, in ms. */
const COPIED_FEEDBACK_MS = 1800;

interface AgentCodeBlockProps {
  code: string;
  /** Fence info string, when the model wrote one. */
  language: string | null;
  /** Answering agent colour, so the block belongs to its bubble. */
  accent: string;
}

/**
 * A fenced code block from an agent answer: its own dark card, the language it
 * was tagged with, and a copy button — the learner never has to select code by
 * hand. Loaded lazily, so chats without code never pay for the highlighter.
 */
export function AgentCodeBlock({
  code,
  language,
  accent,
}: AgentCodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Clipboard blocked (insecure context or denied permission). The code
      // stays selectable, so it can still be copied by hand.
    }
  };

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        borderColor: `${accent}33`,
        backgroundColor: 'rgb(6, 10, 20)',
      }}
    >
      <div
        className="flex items-center justify-between gap-2 border-b px-3 py-1.5"
        style={{
          borderColor: `${accent}26`,
          backgroundColor: `${accent}0d`,
        }}
      >
        <span
          className="truncate text-[10px] font-semibold tracking-wide uppercase"
          style={{ color: accent }}
        >
          {language ?? 'código'}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label="Copiar código"
          className="
            flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px]
            font-medium text-muted-foreground transition-colors
            hover:bg-white/[0.08] hover:text-foreground
          "
        >
          {isCopied ? (
            <>
              <Check className="size-3" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copiar
            </>
          )}
        </button>
      </div>

      <div className="scrollbar-minimal overflow-x-auto">
        <SyntaxHighlighter
          language={language ?? 'text'}
          style={oneDark}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '12px 14px',
            background: 'transparent',
            fontSize: '12px',
            lineHeight: 1.6,
          }}
          codeTagProps={{
            style: {
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default AgentCodeBlock;
