'use client';

import { useState } from 'react';

import {
  FiAward,
  FiClock,
  FiLayers,
  FiMapPin,
  FiTag,
  FiTrendingUp,
} from 'react-icons/fi';

import { cn } from '~/lib/utils';

import ScheduleOptionsPage from '../../../subscription/schedule-options/page';
import SpaceOptionsPage from '../../../subscription/space-options/page';
import CertificationTypesPage from '../../(inicio)/cursos/certification-types/page';
import CategoriesPage from '../../categories/page';
import DifficultiesPage from '../../difficulties/page';
import ModalitiesPage from '../../modalities/page';

const TABS = [
  {
    id: 'categorias',
    label: 'Categorías',
    icon: FiTag,
    Component: CategoriesPage,
  },
  {
    id: 'modalidades',
    label: 'Modalidades',
    icon: FiLayers,
    Component: ModalitiesPage,
  },
  {
    id: 'niveles',
    label: 'Niveles',
    icon: FiTrendingUp,
    Component: DifficultiesPage,
  },
  {
    id: 'horarios',
    label: 'Horarios',
    icon: FiClock,
    Component: ScheduleOptionsPage,
  },
  {
    id: 'espacios',
    label: 'Espacios',
    icon: FiMapPin,
    Component: SpaceOptionsPage,
  },
  {
    id: 'certificacion',
    label: 'Tipos de Certificación',
    icon: FiAward,
    Component: CertificationTypesPage,
  },
] as const;

export default function ConfiguracionesPage() {
  const [activeTab, setActiveTab] =
    useState<(typeof TABS)[number]['id']>('categorias');

  const ActiveComponent =
    TABS.find((tab) => tab.id === activeTab)?.Component ?? TABS[0].Component;

  return (
    <div
      className="
        p-4
        sm:p-6
      "
    >
      <div>
        <h1
          className="
            text-2xl font-bold text-white
            sm:text-3xl
          "
        >
          Configuraciones
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Gestiona las configuraciones de los cursos.
        </p>
      </div>

      <div
        className="
          mt-6 flex flex-wrap gap-2 rounded-2xl border border-white/10
          bg-gray-900/30 p-2
        "
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-black'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <ActiveComponent />
      </div>
    </div>
  );
}
