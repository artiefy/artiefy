'use client';
import { useEffect, useState } from 'react';

const TYPE_MS = 75;
const ERASE_MS = 40;
const HOLD_MS = 2400;
const GAP_MS = 450;

export type PlaceholderPhase = 'typing' | 'holding' | 'erasing';

// Typewriter-style placeholder: types each phrase letter by letter, holds it,
// erases it letter by letter and moves on to the next one. Starts fully typed
// so SSR and the first client render match.
//
// Deliberately not gated on prefers-reduced-motion: it is text changing in
// place, not movement, and Windows turns that flag on for everyone who
// switches off "Animation effects" (same call as `.neon-search-ring`).
export function useRotatingPlaceholder(phrases: readonly string[]) {
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(phrases[0]?.length ?? 0);
  const [phase, setPhase] = useState<PlaceholderPhase>('holding');

  useEffect(() => {
    if (phrases.length < 2) return;

    const full = phrases[index]?.length ?? 0;
    let delay: number;
    let step: () => void;

    if (phase === 'holding') {
      delay = HOLD_MS;
      step = () => setPhase('erasing');
    } else if (phase === 'erasing' && length <= 0) {
      delay = GAP_MS;
      step = () => {
        setIndex((index + 1) % phrases.length);
        setPhase('typing');
      };
    } else if (phase === 'typing' && length >= full) {
      delay = 0;
      step = () => setPhase('holding');
    } else {
      delay = phase === 'erasing' ? ERASE_MS : TYPE_MS;
      step = () => setLength(length + (phase === 'erasing' ? -1 : 1));
    }

    const id = window.setTimeout(step, delay);
    return () => window.clearTimeout(id);
  }, [phrases, index, length, phase]);

  return {
    text: phrases[index]?.slice(0, length) ?? '',
    phase,
  };
}
