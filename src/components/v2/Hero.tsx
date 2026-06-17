import { SearchBar } from './SearchBar';

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 pt-24 text-center sm:pt-32">
      <div className="animate-in fade-in slide-in-from-bottom-8 relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 duration-1000">
        {/* Badge / Eyebrow */}
        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
          <span className="relative mr-2 flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
          </span>
          La nueva plataforma de Artiefy
        </div>

        {/* Main Headline */}
        <div className="space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Transforma tus ideas con el{' '}
            <span className="bg-gradient-to-br from-primary via-blue-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              poder del conocimiento
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            Domina las habilidades del futuro con cursos interactivos, proyectos
            reales y el soporte de una comunidad impulsada por inteligencia
            artificial.
          </p>
        </div>

        {/* Search Interaction */}
        <div className="flex w-full flex-col items-center gap-4 pt-4">
          <SearchBar />
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-slate-400">
            <span>Populares:</span>
            <span className="cursor-pointer rounded-full bg-white/5 px-3 py-1 transition-colors hover:bg-white/10 hover:text-white">
              Python
            </span>
            <span className="cursor-pointer rounded-full bg-white/5 px-3 py-1 transition-colors hover:bg-white/10 hover:text-white">
              Data Science
            </span>
            <span className="cursor-pointer rounded-full bg-white/5 px-3 py-1 transition-colors hover:bg-white/10 hover:text-white">
              Machine Learning
            </span>
          </div>
        </div>
      </div>

      {/* Decorative glowing orbs behind text */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[600px] w-[800px] -translate-1/2 opacity-30 mix-blend-screen">
        <div className="absolute top-1/4 left-1/4 size-[400px] rounded-full bg-primary blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 size-[400px] rounded-full bg-indigo-600 blur-[120px]" />
      </div>
    </section>
  );
}
