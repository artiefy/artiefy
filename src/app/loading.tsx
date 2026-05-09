const starParticles = [
  { left: '12%', top: '28%', delay: '0s', duration: '1.2s' },
  { left: '68%', top: '20%', delay: '0.25s', duration: '1.6s' },
  { left: '82%', top: '62%', delay: '0.7s', duration: '1.8s' },
  { left: '48%', top: '36%', delay: '0.9s', duration: '1.45s' },
  { left: '18%', top: '52%', delay: '1.1s', duration: '1.55s' },
];

export default function Loading() {
  return (
    <main className="loading-page" aria-live="polite" aria-busy="true">
      <section className="loading-shell" aria-label="Cargando">
        <div className="loading-rocket-frame" aria-hidden="true">
          <div className="loading-star-field">
            {starParticles.map((particle, index) => (
              <span
                key={index}
                style={{
                  animationDelay: particle.delay,
                  animationDuration: particle.duration,
                  left: particle.left,
                  top: particle.top,
                }}
              />
            ))}
          </div>

          <div className="loading-spaceship">
            <svg
              viewBox="0 0 64 120"
              className="loading-rocket-svg"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="loadingRocketGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="hsl(180 100% 40%)" />
                  <stop offset="100%" stopColor="hsl(190 100% 50%)" />
                </linearGradient>
                <linearGradient
                  id="loadingRocketDark"
                  x1="100%"
                  y1="0%"
                  x2="0%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="hsl(200 100% 25%)" />
                  <stop offset="100%" stopColor="hsl(190 100% 35%)" />
                </linearGradient>
                <linearGradient
                  id="loadingFlameOuter"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="hsl(180 100% 80%)" />
                  <stop offset="15%" stopColor="hsl(60 100% 70%)" />
                  <stop offset="40%" stopColor="hsl(35 100% 60%)" />
                  <stop
                    offset="70%"
                    stopColor="hsl(20 100% 50%)"
                    stopOpacity="0.6"
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(10 100% 40%)"
                    stopOpacity="0"
                  />
                </linearGradient>
                <linearGradient
                  id="loadingFlameMiddle"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="hsl(0 0% 100%)" />
                  <stop offset="20%" stopColor="hsl(55 100% 85%)" />
                  <stop offset="50%" stopColor="hsl(45 100% 65%)" />
                  <stop
                    offset="100%"
                    stopColor="hsl(30 100% 55%)"
                    stopOpacity="0"
                  />
                </linearGradient>
                <linearGradient
                  id="loadingFlameCore"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="hsl(0 0% 100%)" />
                  <stop offset="40%" stopColor="hsl(190 80% 90%)" />
                  <stop
                    offset="100%"
                    stopColor="hsl(50 100% 80%)"
                    stopOpacity="0"
                  />
                </linearGradient>
                <filter id="loadingFlameGlow">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="loadingFlameBlur">
                  <feGaussianBlur stdDeviation="0.8" />
                </filter>
              </defs>

              <path d="M32 4 L32 52 L16 52 Z" fill="url(#loadingRocketDark)" />
              <path
                d="M32 4 L32 52 L48 52 Z"
                fill="url(#loadingRocketGradient)"
              />
              <path
                d="M32 8 L32 48"
                stroke="hsl(180 100% 70% / 0.4)"
                strokeWidth="1"
              />

              <g filter="url(#loadingFlameGlow)">
                <path
                  d="M20 52 Q25 66, 29 78 Q30 84, 32 92 Q34 84, 35 78 Q39 66, 44 52 Z"
                  fill="url(#loadingFlameOuter)"
                  opacity="0.8"
                >
                  <animate
                    attributeName="d"
                    dur="0.3s"
                    repeatCount="indefinite"
                    values="
                      M20 52 Q25 66, 29 78 Q30 84, 32 92 Q34 84, 35 78 Q39 66, 44 52 Z;
                      M21 52 Q27 64, 30 76 Q31 82, 32 90 Q33 82, 34 76 Q37 64, 43 52 Z;
                      M19 52 Q24 68, 28 80 Q30 86, 32 94 Q34 86, 36 80 Q40 68, 45 52 Z;
                      M20 52 Q25 66, 29 78 Q30 84, 32 92 Q34 84, 35 78 Q39 66, 44 52 Z
                    "
                  />
                </path>
                <path
                  d="M24 52 Q28 63, 30 72 Q31 78, 32 84 Q33 78, 34 72 Q36 63, 40 52 Z"
                  fill="url(#loadingFlameMiddle)"
                  opacity="0.9"
                  filter="url(#loadingFlameBlur)"
                >
                  <animate
                    attributeName="d"
                    dur="0.2s"
                    repeatCount="indefinite"
                    values="
                      M24 52 Q28 63, 30 72 Q31 78, 32 84 Q33 78, 34 72 Q36 63, 40 52 Z;
                      M25 52 Q29 62, 30 70 Q31 76, 32 82 Q33 76, 34 70 Q35 62, 39 52 Z;
                      M23 52 Q27 65, 29 74 Q31 80, 32 86 Q33 80, 35 74 Q37 65, 41 52 Z;
                      M24 52 Q28 63, 30 72 Q31 78, 32 84 Q33 78, 34 72 Q36 63, 40 52 Z
                    "
                  />
                </path>
                <path
                  d="M28 52 Q30 61, 31 68 Q31.5 73, 32 78 Q32.5 73, 33 68 Q34 61, 36 52 Z"
                  fill="url(#loadingFlameCore)"
                  opacity="0.95"
                >
                  <animate
                    attributeName="d"
                    dur="0.15s"
                    repeatCount="indefinite"
                    values="
                      M28 52 Q30 61, 31 68 Q31.5 73, 32 78 Q32.5 73, 33 68 Q34 61, 36 52 Z;
                      M29 52 Q30 60, 31 66 Q31.5 71, 32 76 Q32.5 71, 33 66 Q34 60, 35 52 Z;
                      M28 52 Q30 63, 31 70 Q31.5 75, 32 80 Q32.5 75, 33 70 Q34 63, 36 52 Z;
                      M28 52 Q30 61, 31 68 Q31.5 73, 32 78 Q32.5 73, 33 68 Q34 61, 36 52 Z
                    "
                  />
                </path>
              </g>
            </svg>
          </div>
        </div>

        <p className="loading-message">Cargando...</p>
      </section>
    </main>
  );
}
