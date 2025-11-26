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
    <div className="flex items-center justify-around border-b border-gray-700 bg-[#071024] p-1 sm:p-2">
      <button
        onClick={() => onSectionChange('tickets')}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${
          activeSection === 'tickets'
            ? 'bg-white/6 text-white'
            : 'text-white/60 hover:bg-white/4'
        }`}
        title="Tickets"
      >
        <Ticket className="h-6 w-6 flex-shrink-0 text-white sm:h-5 sm:w-5" />
        <span className="hidden sm:inline">Tickets</span>
      </button>

      <button
        onClick={() => onSectionChange('chatia')}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${
          activeSection === 'chatia'
            ? 'bg-white/6 text-white'
            : 'text-white/60 hover:bg-white/4'
        }`}
        title="Chat IA"
      >
        <MessageSquare className="h-6 w-6 flex-shrink-0 text-white sm:h-5 sm:w-5" />
        <span className="hidden sm:inline">Chat IA</span>
      </button>

      <button
        onClick={() => onSectionChange('projects')}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${
          activeSection === 'projects'
            ? 'bg-white/6 text-white'
            : 'text-white/60 hover:bg-white/4'
        }`}
        title="Proyectos"
      >
        <FileText className="h-6 w-6 flex-shrink-0 text-white sm:h-5 sm:w-5" />
        <span className="hidden sm:inline">Proyectos</span>
      </button>
    </div>
  );
};
