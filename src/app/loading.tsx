'use client';

import React, { useEffect, useMemo, useState } from 'react';

// --- INTERFAZ PARA LAS ESTRELLAS ---
interface Star {
  id: number;
  left: number; // %
  top: number; // %
  size: number; // px
  opacity: number;
  blur: number; // px
  twinkleDur: number; // s
  layer: 1 | 2; // profundidad
}

// --- IMG SEGURO (no revienta si el asset no existe) ---
function SafeImg({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

// --- ÍCONO COHETE (paper-plane) NO pixelado ---
function ArtiefyRocketIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      className={`overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Cara clara (inferior) */}
        <linearGradient
          id="planeLight"
          x1="18"
          y1="112"
          x2="118"
          y2="14"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#007F96" />
          <stop offset="0.55" stopColor="#00CBE8" />
          <stop offset="1" stopColor="#E9FFFF" />
        </linearGradient>

        {/* Cara oscura (MITAD SUPERIOR), con brillo hacia blanco como el ejemplo */}
        <linearGradient
          id="planeDark"
          x1="10"
          y1="118"
          x2="116"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#012A38" stopOpacity="1" />
          <stop offset="0.55" stopColor="#044E66" stopOpacity="1" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.48" />
        </linearGradient>

        {/* Borde brillante vertical (derecha) */}
        <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EFFFFF" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#7FEFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#00CBE8" stopOpacity="0" />
        </linearGradient>

        {/* Brillo diagonal superior */}
        <linearGradient id="edgeGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Fuego */}
        <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF176" />
          <stop offset="0.22" stopColor="#FFC107" />
          <stop offset="0.62" stopColor="#FF5722" />
          <stop offset="1" stopColor="#FF5722" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* FUEGO (detrás del cohete): pegado a la cola, diagonal y más ancho */}
      <g
        transform="translate(62 84) rotate(35) scale(2.25 1.95)"
        opacity="0.98"
        style={{ filter: 'drop-shadow(0 0 18px rgba(255, 87, 34, 0.40))' }}
      >
        <g className="thrusterMain">
          <path
            d="M0 0 Q -14 20 0 72 Q 14 20 0 0"
            fill="url(#flame)"
            className="thruster-main"
            opacity="0.98"
          />
          <path
            d="M0 0 Q -7 10 0 28 Q 7 10 0 0"
            fill="#FFFFFF"
            className="thruster-core"
            opacity="0.95"
          />
          <circle cx="0" cy="22" r="3" fill="#FFEB3B" className="p p1" />
          <circle cx="-6" cy="40" r="2.1" fill="#FF9800" className="p p2" />
          <circle cx="6" cy="52" r="1.9" fill="#FF5722" className="p p3" />
        </g>
      </g>

      {/* Cohete */}
      <g style={{ filter: 'drop-shadow(0 0 14px rgba(0, 189, 216, 0.55))' }}>
        {/*
          Ajuste solicitado:
          - Cohete MÁS LARGO (como el ejemplo).
          - NO pintar la parte de abajo con azul oscuro: solo arriba.
          - Contorno BLANCO.
          - Mantener base clara como antes.
        */}

        {/* 1) Base clara (silueta completa, ahora más larga) */}
        <path
          d="M18 78 L112 18 L96 116 L60 86 L18 78 Z"
          fill="url(#planeLight)"
        />

        {/* 2) Mitad superior oscura (cubre TODO arriba), sin tocar la parte inferior */}
        <path d="M18 78 L112 18 L60 86 L18 78 Z" fill="url(#planeDark)" />

        {/* 3) Contorno BLANCO */}
        <path
          d="M18 78 L112 18 L96 116 L60 86 L18 78 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinejoin="round"
          opacity="0.92"
        />

        {/* 4) Línea de pliegue (sutil) */}
        <path
          d="M60 86 L112 18"
          stroke="#001422"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.22"
        />

        {/* 5) Brillo superior */}
        <path
          d="M20 78 L112 18"
          stroke="url(#edgeGlow)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.82"
        />

        {/* 6) Borde brillante derecho (se conserva, pero no reemplaza el contorno blanco) */}
        <path
          d="M96 116 L112 18"
          stroke="url(#rim)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* 7) Brillo interno */}
        <path
          d="M84 36 L104 28"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.16"
        />
      </g>
    </svg>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function safePct(n: unknown, fallback: number) {
  if (!isFiniteNumber(n)) return clamp(fallback, 0, 100);
  return clamp(n, 0, 100);
}

function randBetween(min: number, max: number) {
  const r = typeof Math.random === 'function' ? Math.random() : 0.5;
  return min + (max - min) * r;
}

function randPct(fallback: number) {
  const r = typeof Math.random === 'function' ? Math.random() : 0.5;
  return safePct(r * 100, fallback);
}

export default function Loading() {
  const [progress, setProgress] = useState(12);

  // Generamos estrellas con inicialización lazy (solo en cliente, sin renders en cascada)
  const [stars] = useState<Star[]>(() => {
    const total = 260;
    const s: Star[] = [];

    for (let i = 0; i < total; i++) {
      const layer: 1 | 2 = randBetween(0, 1) < 0.65 ? 1 : 2;
      const size = layer === 1 ? randBetween(0.6, 2.6) : randBetween(1.0, 3.8);
      const opacity =
        layer === 1 ? randBetween(0.08, 0.55) : randBetween(0.18, 0.85);
      const blur = layer === 1 ? randBetween(0, 0.8) : randBetween(0, 1.4);
      const twinkleDur =
        layer === 1 ? randBetween(1.6, 4.4) : randBetween(2.2, 6.0);

      const leftFallback = (i * 37) % 100;
      const topFallback = (i * 53) % 100;

      const left = randPct(leftFallback);
      const top = randPct(topFallback);

      s.push({
        id: i,
        left,
        top,
        size,
        opacity,
        blur,
        twinkleDur,
        layer,
      });
    }

    // "Test cases" en runtime (solo dev) para asegurar invariantes
    if (process.env.NODE_ENV !== 'production') {
      const anyInvalid = s.some(
        (st) => !isFiniteNumber(st.left) || !isFiniteNumber(st.top)
      );

      console.assert(
        !anyInvalid,
        '[Loading] Starfield: left/top no deben ser null/NaN/Infinity.'
      );

      const anyOutOfRange = s.some(
        (st) => st.left < 0 || st.left > 100 || st.top < 0 || st.top > 100
      );

      console.assert(
        !anyOutOfRange,
        '[Loading] Starfield: left/top deben estar en rango 0..100.'
      );

      const hasLayer1 = s.some((st) => st.layer === 1);
      const hasLayer2 = s.some((st) => st.layer === 2);

      console.assert(
        hasLayer1 && hasLayer2,
        '[Loading] Starfield: deben existir layer 1 y 2.'
      );

      const idSet = new Set(s.map((x) => x.id));

      console.assert(
        idSet.size === s.length,
        '[Loading] Starfield: IDs duplicados detectados.'
      );

      // Nuevo test: tamaño y opacidad nunca negativos
      const anyNegative = s.some((st) => st.size <= 0 || st.opacity < 0);

      console.assert(!anyNegative, '[Loading] Starfield: size>0 y opacity>=0.');

      // Nuevo test: blur no negativo
      const anyBlurNegative = s.some((st) => st.blur < 0);

      console.assert(!anyBlurNegative, '[Loading] Starfield: blur>=0.');
    }

    return s;
  });

  // Barra de progreso "fake" (opcional)
  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        const r = typeof Math.random === 'function' ? Math.random() : 0.5;
        const next = p + (p < 70 ? 3 : p < 90 ? 1.5 : 0.5) * (r * 0.8 + 0.6);
        return clamp(next, 10, 100);
      });
    }, 150);
    return () => clearInterval(t);
  }, []);

  const safeStars = useMemo(
    () =>
      stars.filter((st) => isFiniteNumber(st.left) && isFiniteNumber(st.top)),
    [stars]
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#01142B]">
      {/* Fondo Gradiente (como el ejemplo viejo) */}
      <div
        className="absolute inset-0 z-0 bg-gradient-to-br from-[#00BDD8] via-[#01142B] to-[#2ecc71]"
        style={{
          backgroundSize: '400% 400%',
          animation: 'gradientBG 15s ease infinite',
          opacity: 0.8,
        }}
      />

      {/* STARFIELD (movimiento) */}
      <div className="absolute inset-0 z-10">
        <div className="starfield starfield--slow">
          {safeStars
            .filter((st) => st.layer === 1)
            .map((st) => (
              <span
                key={st.id}
                className="star"
                style={{
                  left: `${safePct(st.left, 50)}%`,
                  top: `${safePct(st.top, 50)}%`,
                  width: `${st.size}px`,
                  height: `${st.size}px`,
                  opacity: st.opacity,
                  filter: `blur(${st.blur}px)`,
                  animationDuration: `${st.twinkleDur}s`,
                }}
              />
            ))}
        </div>

        <div className="starfield starfield--fast">
          {safeStars
            .filter((st) => st.layer === 2)
            .map((st) => (
              <span
                key={st.id}
                className="star"
                style={{
                  left: `${safePct(st.left, 50)}%`,
                  top: `${safePct(st.top, 50)}%`,
                  width: `${st.size}px`,
                  height: `${st.size}px`,
                  opacity: st.opacity,
                  filter: `blur(${st.blur}px)`,
                  animationDuration: `${st.twinkleDur}s`,
                }}
              />
            ))}
        </div>
      </div>

      {/* Ícono centrado */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        <div className="rocketWrap mt-40 -mb-15">
          {/* Apunta a la esquina superior derecha */}
          <ArtiefyRocketIcon className="size-28" />
        </div>

        <div className="mt-48 flex items-center gap-3 font-mono text-lg tracking-widest text-white/90 uppercase">
          <span className="pulseText">Cargando tus ideas</span>
          <SafeImg
            src="/artiefy-icon.png"
            alt="Artiefy"
            width={36}
            height={36}
            className="animate-pulse opacity-90"
          />
        </div>

        <div className="mt-12 w-[min(520px,78vw)]">
          <div className="h-3 rounded-full border border-cyan-200/30 bg-white/5 p-[2px] shadow-[0_0_24px_rgba(0,189,216,0.20)]">
            <div
              className="h-full rounded-full bg-cyan-300/80"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Logo superior (opcional) */}
      <div className="absolute top-16 left-1/2 z-30 -translate-x-1/2 select-none">
        <div className="flex items-center gap-3">
          <SafeImg
            src="/artiefy-logo.png"
            alt="Artiefy"
            width={180}
            height={50}
          />
        </div>
      </div>

      <style>{`
        /* Fondo gradiente animado (como el ejemplo viejo) */
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* =============================
           STARFIELD
           - movemos contenedores completos para dar ilusión de "navegación".
           - dirección: hacia abajo/izquierda, como si el cohete avanzara hacia arriba/derecha.
        ============================== */

        .starfield {
          position: absolute;
          inset: -20%;
          will-change: transform;
          pointer-events: none;
        }

        .starfield--slow {
          animation: driftSlow 10s linear infinite;
          opacity: 0.95;
        }

        .starfield--fast {
          animation: driftFast 6s linear infinite;
          opacity: 1;
        }

        @keyframes driftSlow {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-140px, 220px, 0); }
        }

        @keyframes driftFast {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-240px, 380px, 0); }
        }

        .star {
          position: absolute;
          border-radius: 9999px;
          background: rgba(255,255,255,1);
          box-shadow: 0 0 10px rgba(255,255,255,0.18);
          animation-name: twinkle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        @keyframes twinkle {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.5); opacity: 1; }
        }

        /* =============================
           ÍCONO
        ============================== */

        .rocketWrap {
          animation: rocketFloat 2.6s ease-in-out infinite;
          /* Más inclinación a la derecha para que coincida con el eje del fuego */
          transform: translateY(-24px) rotate(16deg);
        }

        @keyframes rocketFloat {
          0%, 100% { transform: translateY(-24px) rotate(16deg) scale(1); }
          50% { transform: translateY(-34px) rotate(16deg) scale(1.01); }
        }


        .pulseText {
          animation: textPulse 1.2s ease-in-out infinite;
        }

        @keyframes textPulse {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        .thrusterMain {
          transform-box: fill-box;
          transform-origin: 0 0;
        }

        /* Animación estilo original (main/core + partículas) */
        .thruster-main {
          animation: thrusterBurn 0.08s infinite alternate ease-in-out;
          transform-origin: 0 0;
        }
        @keyframes thrusterBurn {
          0% { transform: scaleY(1) scaleX(1); opacity: 0.92; }
          100% { transform: scaleY(1.35) scaleX(0.9); opacity: 1; filter: brightness(1.2); }
        }

        .thruster-core {
          animation: corePulse 0.10s infinite alternate ease-in-out;
          transform-origin: 0 0;
        }
        @keyframes corePulse {
          0% { transform: scaleY(0.92) scaleX(0.92); opacity: 0.9; }
          100% { transform: scaleY(1.12) scaleX(1.08); opacity: 1; }
        }

        .p { animation: particleEject 0.55s infinite linear; }
        .p.p2 { animation-duration: 0.65s; animation-delay: 0.08s; }
        .p.p3 { animation-duration: 0.78s; animation-delay: 0.16s; }

        @keyframes particleEject {
          0% { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(0, 34px); opacity: 0; }
        }

        /* Respeta preferencias del usuario */
        @media (prefers-reduced-motion: reduce) {
          .starfield--slow,
          .starfield--fast,
          .rocketWrap,
          .pulseText,
          .thruster-main,
          .thruster-core,
          .p {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
