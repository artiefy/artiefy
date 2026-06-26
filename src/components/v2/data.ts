/**
 * Static landing content for the v2 page.
 *
 * Intentionally hardcoded (no DB/CMS yet): student feedback and educator
 * profiles are curated copy. Swap to real data sources later if needed.
 */

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  initials: string;
  /** Whole-number rating 1-5. */
  rating: number;
  /** Tailwind gradient classes for the avatar ring. */
  accent: string;
}

export interface Educator {
  name: string;
  specialty: string;
  bio: string;
  initials: string;
  /** Number of published courses. */
  courses: number;
  /** Human-readable student count, e.g. "3.2k". */
  students: string;
  tags: string[];
  /** Tailwind gradient classes for the card header. */
  accent: string;
}

export const testimonials: Testimonial[] = [
  {
    name: 'Valentina Ríos',
    role: 'Estudiante de Data Science',
    quote:
      'Pasé de no saber programar a construir mi primer modelo de machine learning en tres meses. Los proyectos reales fueron lo que cambió todo.',
    initials: 'VR',
    rating: 5,
    accent: 'from-primary to-blue-500',
  },
  {
    name: 'Mateo Cárdenas',
    role: 'Desarrollador Frontend',
    quote:
      'La tutoría con IA me respondía dudas a las 2 de la mañana sin juzgarme. Es como tener un mentor disponible siempre que lo necesito.',
    initials: 'MC',
    rating: 5,
    accent: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Laura Beltrán',
    role: 'Diseñadora UX',
    quote:
      'Lo que más valoro es la comunidad. Recibí feedback honesto sobre mi portafolio y terminé consiguiendo mi primer trabajo remoto.',
    initials: 'LB',
    rating: 5,
    accent: 'from-pink-500 to-rose-500',
  },
  {
    name: 'Andrés Quintero',
    role: 'Estudiante de IA',
    quote:
      'Probé otras plataformas y siempre abandonaba. Acá la ruta de aprendizaje está tan bien armada que de verdad terminás los cursos.',
    initials: 'AQ',
    rating: 5,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Camila Forero',
    role: 'Analista de Datos',
    quote:
      'Los certificados me abrieron puertas en entrevistas. Pero lo que realmente me preparó fueron los proyectos que hoy muestro en mi CV.',
    initials: 'CF',
    rating: 5,
    accent: 'from-amber-500 to-orange-500',
  },
  {
    name: 'Sebastián Mora',
    role: 'Ingeniero de Software',
    quote:
      'Estudio mientras trabajo y el ritmo flexible fue clave. Avanzo a mi velocidad sin sentir que me quedo atrás del grupo.',
    initials: 'SM',
    rating: 5,
    accent: 'from-cyan-500 to-sky-500',
  },
];

export const educators: Educator[] = [
  {
    name: 'Dra. Elena Vargas',
    specialty: 'Inteligencia Artificial',
    bio: 'PhD en Machine Learning. Ex-investigadora en visión por computador con más de 10 años formando talento técnico.',
    initials: 'EV',
    courses: 12,
    students: '8.4k',
    tags: ['Deep Learning', 'Python', 'Visión'],
    accent: 'from-primary to-blue-600',
  },
  {
    name: 'Carlos Restrepo',
    specialty: 'Desarrollo Web Full-Stack',
    bio: 'Arquitecto de software y GDE. Construyó plataformas a escala antes de dedicarse por completo a la enseñanza.',
    initials: 'CR',
    courses: 18,
    students: '15.2k',
    tags: ['React', 'Node', 'TypeScript'],
    accent: 'from-indigo-500 to-violet-600',
  },
  {
    name: 'Mariana López',
    specialty: 'Ciencia de Datos',
    bio: 'Lead Data Scientist en fintech. Especialista en traducir matemática compleja en intuición clara para principiantes.',
    initials: 'ML',
    courses: 9,
    students: '6.1k',
    tags: ['Estadística', 'SQL', 'Pandas'],
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Julián Ospina',
    specialty: 'Diseño de Producto',
    bio: 'Diseñador senior con foco en sistemas de diseño y accesibilidad. Cree que el buen diseño se enseña con la práctica.',
    initials: 'JO',
    courses: 7,
    students: '4.9k',
    tags: ['UX', 'Figma', 'Design Systems'],
    accent: 'from-pink-500 to-rose-600',
  },
  {
    name: 'Daniel Herrera',
    specialty: 'Ciberseguridad',
    bio: 'Pentester certificado y consultor. Enseña seguridad ofensiva y defensiva con laboratorios prácticos del mundo real.',
    initials: 'DH',
    courses: 11,
    students: '7.3k',
    tags: ['Hacking Ético', 'Redes', 'Cloud'],
    accent: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Sofía Naranjo',
    specialty: 'Marketing Digital',
    bio: 'Estratega de growth para startups. Combina datos y creatividad para enseñar marketing que de verdad convierte.',
    initials: 'SN',
    courses: 14,
    students: '10.8k',
    tags: ['SEO', 'Analytics', 'Contenido'],
    accent: 'from-cyan-500 to-sky-600',
  },
];
