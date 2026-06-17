import { FaBrain, FaCode, FaRocket, FaUsers } from 'react-icons/fa';

const features = [
  {
    title: 'Aprendizaje Práctico',
    description:
      'Aprende haciendo. Todos nuestros cursos incluyen proyectos del mundo real que podrás sumar a tu portafolio.',
    icon: FaCode,
  },
  {
    title: 'Impulsado por IA',
    description:
      'Nuestra plataforma utiliza IA para personalizar tu ruta de aprendizaje y ofrecerte tutoría 24/7.',
    icon: FaBrain,
  },
  {
    title: 'Comunidad Activa',
    description:
      'Conecta con otros estudiantes, recibe feedback de expertos y colabora en proyectos Open Source.',
    icon: FaUsers,
  },
  {
    title: 'Acelera tu Carrera',
    description:
      'Preparación para entrevistas, revisión de CV y conexión directa con empresas líderes del sector.',
    icon: FaRocket,
  },
];

export function Features() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          ¿Por qué elegir Artiefy?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
          Diseñado para que domines las tecnologías más demandadas del mercado
          con una metodología innovadora.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm transition-all hover:-translate-y-2 hover:border-primary/50 hover:bg-slate-900/80 hover:shadow-primary/20"
            >
              {/* Decorative top gradient */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="mb-6 inline-flex rounded-xl bg-primary/10 p-4 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <Icon className="size-8" />
              </div>

              <h3 className="mb-3 text-xl font-semibold text-white">
                {feature.title}
              </h3>

              <p className="leading-relaxed text-slate-400">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
