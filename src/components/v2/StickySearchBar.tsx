'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import gsap from 'gsap';
import { FaArrowRight, FaSearch } from 'react-icons/fa';

import { Button } from '~/components/estudiantes/ui/button';
import { Input } from '~/components/estudiantes/ui/input';

/**
 * Minimalist floating search pill, centered and docked at the BOTTOM of the
 * viewport once the user scrolls past the hero search. Always reachable while
 * reading the rest of the landing.
 *
 * - Visibility is driven by an IntersectionObserver on `#hero-search-anchor`
 *   (the hero's main search). Falls back to a scroll threshold if absent.
 * - Slides up from the bottom with GSAP; respects prefers-reduced-motion.
 * - SSR-safe: starts hidden via class + transform so there is no flash.
 */
export function StickySearchBar() {
  const router = useRouter();
  const barRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(false);

  // Decide when the sticky bar should appear.
  useEffect(() => {
    const anchor = document.getElementById('hero-search-anchor');

    if (!anchor) {
      const onScroll = () => setVisible(window.scrollY > 480);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 }
    );
    io.observe(anchor);
    return () => io.disconnect();
  }, []);

  // Animate the dock in/out whenever visibility changes.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (reduce) {
      gsap.set(el, { y: visible ? 0 : '150%', autoAlpha: visible ? 1 : 0 });
      return;
    }

    gsap.to(el, {
      y: visible ? 0 : '150%',
      autoAlpha: visible ? 1 : 0,
      duration: 0.45,
      ease: visible ? 'power3.out' : 'power2.in',
    });
  }, [visible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/cursos?q=${encodeURIComponent(q)}`);
  };

  return (
    <div
      ref={barRef}
      aria-hidden={!visible}
      className="pointer-events-none invisible fixed inset-x-0 bottom-6 z-[90] flex translate-y-[150%] justify-center px-4"
    >
      <form
        onSubmit={handleSubmit}
        className="pointer-events-auto flex w-[min(92vw,30rem)] items-center gap-1.5 rounded-full border border-white/60 bg-white/90 py-1.5 pr-1.5 pl-4 shadow-xl shadow-black/40 backdrop-blur-xl"
      >
        <FaSearch className="size-4 shrink-0 text-slate-500" />
        <Input
          type="text"
          tabIndex={visible ? 0 : -1}
          placeholder="Buscar cursos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 flex-1 border-0 bg-transparent px-1 text-base text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          type="submit"
          aria-label="Buscar"
          tabIndex={visible ? 0 : -1}
          className="size-9 shrink-0 rounded-full bg-primary p-0 text-primary-foreground transition-transform hover:scale-105 hover:bg-primary/90"
        >
          <FaArrowRight className="size-4" />
        </Button>
      </form>
    </div>
  );
}
