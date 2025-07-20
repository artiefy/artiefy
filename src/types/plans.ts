import { type IconType } from 'react-icons';
import { AiOutlineCrown } from 'react-icons/ai';
import { BsStars } from 'react-icons/bs';
import { FaBook } from 'react-icons/fa';

export interface Plan {
  id: number;
  name: string;
  price: number;
  priceUsd: number;
  period: string;
  courses: string;
  projects: number | string;
  features: { text: string; available: boolean }[];
  icon: IconType;
}

export const plansPersonas: Plan[] = [
  {
    id: 1,
    name: 'Pro',
    price: 99800,
    priceUsd: 25,
    period: '/mes',
    courses: 'Ilimitados',
    projects: 15,
    features: [
      { text: 'Acceso limitado a programas', available: false },
      { text: 'Materiales de curso premium', available: true },
      { text: 'Soporte comunitario prioritario', available: true },
      { text: 'Sesiones de mentoría 1 a 1', available: true },
      { text: 'Acceso a foros exclusivos', available: true },
    ],
    icon: BsStars,
  },
  {
    id: 2,
    name: 'Premium',
    price: 149800,
    priceUsd: 37,
    period: '/mes',
    courses: 'Ilimitados',
    projects: 'Ilimitados',
    features: [
      { text: 'Acceso a todos los cursos', available: true },
      { text: 'Materiales de curso premium', available: true },
      { text: 'Soporte comunitario prioritario', available: true },
      { text: 'Sesiones de mentoría 1 a 1', available: true },
      { text: 'Acceso a foros exclusivos', available: true },
    ],
    icon: AiOutlineCrown,
  },
];

export const plansEmpresas: Plan[] = [
  {
    id: 3,
    name: 'Enterprise',
    price: 200000,
    priceUsd: 50,
    period: '/mes',
    courses: 'Ilimitados',
    projects: 'Ilimitados',
    features: [
      { text: 'Todo en el plan Premium', available: true },
      { text: 'Soporte técnico dedicado', available: true },
      { text: 'Acceso a cursos exclusivos', available: true },
      { text: 'Consultoría personalizada', available: true },
      { text: 'Certificaciones con el Ciadet', available: true },
    ],
    icon: FaBook,
  },
];
