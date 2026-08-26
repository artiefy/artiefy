'use client';

import {
  AgentMessageContent,
  messageHasCode,
} from '~/components/agents/AgentMessageContent';
import { useMessageReveal } from '~/hooks/useMessageReveal';

interface AgentRevealedContentProps {
  text: string;
  /** Answering agent colour, passed down to the code blocks. */
  accent: string;
  /** True only for the single message currently animating. */
  active: boolean;
  /** Re-pins the scroll container as the revealed text grows. */
  onRevealTick?: () => void;
}

/**
 * Leaf wrapper around `AgentMessageContent` that owns the reveal animation
 * for exactly one bubble. Keeping the ticking state here — instead of in the
 * widget that maps over every message — means a tick re-renders this bubble
 * only, not the whole thread.
 *
 * Code answers skip the animation and render instantly: the syntax
 * highlighter behind a fenced block loads lazily, and re-parsing a growing
 * prefix of it on every tick would remount it for no visible benefit.
 */
export function AgentRevealedContent({
  text,
  accent,
  active,
  onRevealTick,
}: AgentRevealedContentProps) {
  const revealActive = active && !messageHasCode(text);

  const { revealedText } = useMessageReveal({
    text,
    active: revealActive,
    onTick: onRevealTick,
  });

  return <AgentMessageContent text={revealedText} accent={accent} />;
}

export default AgentRevealedContent;
