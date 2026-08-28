'use client';

import { useEffect, useRef, useState } from 'react';

/** Reveal never runs slower than this, in characters per second. */
const MIN_CHARS_PER_SECOND = 900;

/** Upper bound on how long a reveal takes, regardless of length, in seconds. */
const MAX_DURATION_SECONDS = 2.2;

/**
 * How often the revealed prefix actually commits to state, in ms. The cursor
 * itself advances every animation frame; committing less often than that
 * keeps the reveal from re-rendering the bubble 60 times a second.
 */
const COMMIT_INTERVAL_MS = 40;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Extends `length` to the end of the word it lands inside, so a tick never
 * cuts a word in half — the reveal advances in whole words, not characters.
 */
function snapToWordBoundary(text: string, length: number): number {
  if (length >= text.length) return text.length;
  let end = length;
  while (end < text.length && !/\s/.test(text[end])) end += 1;
  return end;
}

interface UseMessageRevealOptions {
  /** Full, already-received text to reveal. */
  text: string;
  /** Whether this message is the one currently animating. */
  active: boolean;
  /** Called every time the revealed length grows, to re-pin the scroll. */
  onTick?: () => void;
}

interface UseMessageRevealResult {
  /** Prefix of `text` to render right now: growing while revealing, the
   *  full string once it finishes or whenever `active` is false. */
  revealedText: string;
  /** True only while the animation is actively advancing. */
  isRevealing: boolean;
}

/**
 * Reveals `text` progressively when `active`, at a bounded, fast pace —
 * `max(900 chars/s, length / 2.2s)` — so even a long answer finishes in
 * about two seconds. This is a client-side typewriter over an answer that
 * has already fully arrived, not network streaming.
 *
 * Renders the full text instantly under `prefers-reduced-motion` or
 * whenever `active` is false, and cancels cleanly on unmount or the moment
 * `active` turns false (a new turn starting, the conversation changing).
 */
export function useMessageReveal({
  text,
  active,
  onTick,
}: UseMessageRevealOptions): UseMessageRevealResult {
  const [revealedLength, setRevealedLength] = useState(() =>
    active ? 0 : text.length
  );
  const onTickRef = useRef(onTick);

  // Keep the latest callback without making it a dependency of the reveal
  // effect, which would restart the animation on every parent render.
  useEffect(() => {
    onTickRef.current = onTick;
  });

  useEffect(() => {
    if (!active) {
      setRevealedLength(text.length);
      return;
    }

    if (prefersReducedMotion()) {
      setRevealedLength(text.length);
      onTickRef.current?.();
      return;
    }

    setRevealedLength(0);

    const ratePerSecond = Math.max(
      MIN_CHARS_PER_SECOND,
      text.length / MAX_DURATION_SECONDS
    );

    let frame = 0;
    let lastCommit = 0;
    let start: number | null = null;
    let cancelled = false;

    const step = (timestamp: number) => {
      if (cancelled) return;
      start ??= timestamp;

      const elapsedSeconds = (timestamp - start) / 1000;
      const target = snapToWordBoundary(
        text,
        Math.floor(elapsedSeconds * ratePerSecond)
      );
      const done = target >= text.length;

      if (done || timestamp - lastCommit >= COMMIT_INTERVAL_MS) {
        lastCommit = timestamp;
        setRevealedLength(done ? text.length : target);
        onTickRef.current?.();
      }

      if (!done) frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [active, text]);

  return {
    revealedText: text.slice(0, revealedLength),
    isRevealing: active && revealedLength < text.length,
  };
}

export default useMessageReveal;
