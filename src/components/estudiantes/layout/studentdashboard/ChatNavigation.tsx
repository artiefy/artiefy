'use client';

import React from 'react';

import { FileText, MessageSquare, Ticket } from 'lucide-react';

interface ChatNavigationProps {
  activeSection: 'tickets' | 'chatia' | 'projects';
  onSectionChange: (section: 'tickets' | 'chatia' | 'projects') => void;
}

export const ChatNavigation = ({
  activeSection,
  onSectionChange,
}: ChatNavigationProps) => {
  return (
    <div
      className="
        flex items-center justify-around gap-1 rounded-2xl border
        border-white/10 bg-white/5 p-1 text-[11px]
        sm:p-2 sm:text-xs
      "
    >
      <button
        onClick={() => onSectionChange('tickets')}
        className={`
          flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1
          transition-colors
          sm:gap-2 sm:px-3 sm:py-1.5
          ${
            activeSection === 'tickets'
              ? 'bg-white/6 text-white'
              : `
                text-white/60
                hover:bg-white/4
              `
          }
        `}
        title="Tickets"
      >
        <Ticket
          className="
            size-4 flex-shrink-0 text-white
            sm:size-5
          "
        />
        <span
          className="
            hidden text-xs
            sm:inline sm:text-sm
          "
        >
          Tickets
        </span>
      </button>

      <button
        onClick={() => onSectionChange('chatia')}
        className={`
          flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1
          transition-colors
          sm:gap-2 sm:px-3 sm:py-1.5
          ${
            activeSection === 'chatia'
              ? 'bg-white/6 text-white'
              : `
                text-white/60
                hover:bg-white/4
              `
          }
        `}
        title="Chat IA"
      >
        <MessageSquare
          className="
            size-4 flex-shrink-0 text-white
            sm:size-5
          "
        />
        <span
          className="
            hidden text-xs
            sm:inline sm:text-sm
          "
        >
          Chat IA
        </span>
      </button>

      <button
        onClick={() => onSectionChange('projects')}
        className={`
          flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1
          transition-colors
          sm:gap-2 sm:px-3 sm:py-1.5
          ${
            activeSection === 'projects'
              ? 'bg-white/6 text-white'
              : `
                text-white/60
                hover:bg-white/4
              `
          }
        `}
        title="Proyectos"
      >
        <FileText
          className="
            size-4 flex-shrink-0 text-white
            sm:size-5
          "
        />
        <span
          className="
            hidden text-xs
            sm:inline sm:text-sm
          "
        >
          Proyectos
        </span>
      </button>
    </div>
  );
};
