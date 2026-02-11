'use client';

import { useState } from 'react';

import {
  AlertCircle,
  ClipboardList,
  FileText,
  ListChecks,
  Pencil,
  Plus,
  Target,
  Users,
} from 'lucide-react';

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const AVAILABLE_SECTIONS: Section[] = [
  {
    id: 'introduccion',
    label: 'Introducción',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-blue-400',
  },
  {
    id: 'justificacion',
    label: 'Justificación',
    icon: <Target className="h-4 w-4" />,
    color: 'text-purple-400',
  },
  {
    id: 'marco-teorico',
    label: 'Marco Teórico',
    icon: <ListChecks className="h-4 w-4" />,
    color: 'text-green-400',
  },
  {
    id: 'metodologia',
    label: 'Metodología',
    icon: <ClipboardList className="h-4 w-4" />,
    color: 'text-amber-400',
  },
  {
    id: 'alcance',
    label: 'Alcance',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-cyan-400',
  },
  {
    id: 'equipo',
    label: 'Equipo',
    icon: <Users className="h-4 w-4" />,
    color: 'text-pink-400',
  },
];

interface AddSectionDropdownProps {
  addedSections: string[];
  onSectionSelect: (sectionId: string, isCustom?: boolean) => void;
}

export default function AddSectionDropdown({
  addedSections,
  onSectionSelect,
}: AddSectionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectSection = (sectionId: string) => {
    onSectionSelect(sectionId, false);
    setIsOpen(false);
  };

  const handleCustom = () => {
    onSectionSelect('custom', true);
    setIsOpen(false);
  };

  const availableToAdd = AVAILABLE_SECTIONS.filter(
    (sec) => !addedSections.includes(sec.id)
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        type="button"
      >
        <Plus className="h-4 w-4" />
        Agregar sección
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 min-w-[12rem] overflow-hidden rounded-md border border-border/50 bg-card p-1 shadow-md">
          {availableToAdd.length > 0 ? (
            <>
              {availableToAdd.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSelectSection(section.id)}
                  className="relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  {section.icon}
                  {section.label}
                </button>
              ))}
              <div className="my-1 border-t border-border/50" />
              <button
                onClick={handleCustom}
                className="relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Personalizar...</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleCustom}
              className="relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Personalizar...</span>
            </button>
          )}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
