'use client';

import { useMemo } from 'react';

import dynamic from 'next/dynamic';

/** Only chats that actually contain code load the syntax highlighter. */
const AgentCodeBlock = dynamic(
  () => import('~/components/agents/AgentCodeBlock'),
  {
    loading: () => (
      <div className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
    ),
  }
);

interface MessageSegment {
  kind: 'text' | 'code';
  /** Fence info string for code segments, null otherwise. */
  language: string | null;
  content: string;
}

/**
 * Matches a fenced block. The closing fence is optional so an answer that was
 * cut mid-block still renders as code instead of leaking its backticks.
 */
const CODE_FENCE = /```([\w+#.-]*)[ \t]*\r?\n?([\s\S]*?)(?:```|$)/g;

/** Splits an agent answer into prose and fenced code blocks, in order. */
export function parseMessageSegments(text: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  const fence = new RegExp(CODE_FENCE.source, CODE_FENCE.flags);
  let lastIndex = 0;
  let match = fence.exec(text);

  while (match !== null) {
    if (match.index > lastIndex) {
      segments.push({
        kind: 'text',
        language: null,
        content: text.slice(lastIndex, match.index),
      });
    }

    segments.push({
      kind: 'code',
      language: match[1] || null,
      content: match[2].replace(/\s+$/, ''),
    });

    lastIndex = fence.lastIndex;
    match = fence.exec(text);
  }

  if (lastIndex < text.length) {
    segments.push({
      kind: 'text',
      language: null,
      content: text.slice(lastIndex),
    });
  }

  return segments.filter((segment) => segment.content.trim().length > 0);
}

/** Whether an answer carries code, so its bubble can claim more width. */
export function messageHasCode(text: string): boolean {
  return text.includes('```');
}

interface AgentMessageContentProps {
  text: string;
  /** Answering agent colour, passed down to the code blocks. */
  accent: string;
}

/**
 * Renders an agent answer: prose stays plain text with the model's own line
 * breaks, and every fenced block becomes its own card with a copy button.
 */
export function AgentMessageContent({
  text,
  accent,
}: AgentMessageContentProps) {
  const segments = useMemo(() => parseMessageSegments(text), [text]);

  if (!messageHasCode(text)) {
    return (
      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">
        {text}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {segments.map((segment, index) =>
        segment.kind === 'code' ? (
          <AgentCodeBlock
            key={`code-${index}`}
            code={segment.content}
            language={segment.language}
            accent={accent}
          />
        ) : (
          <p
            key={`text-${index}`}
            className="text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground"
          >
            {segment.content.trim()}
          </p>
        )
      )}
    </div>
  );
}

export default AgentMessageContent;
