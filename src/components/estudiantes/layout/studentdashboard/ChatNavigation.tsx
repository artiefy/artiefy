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
    <div className="flex items-center justify-around border-b border-gray-700 bg-[#071024] p-2">
      <button
        onClick={() => onSectionChange('tickets')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
          activeSection === 'tickets'
            ? 'bg-white/6 text-white'
            : 'text-white/60 hover:bg-white/4'
        }`}
      >
        <Ticket className="h-5 w-5 text-white" />
        <span>Tickets</span>
      </button>

      <button
        onClick={() => onSectionChange('chatia')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
          activeSection === 'chatia'
            ? 'bg-white/6 text-white'
            : 'text-white/60 hover:bg-white/4'
        }`}
      >
        <MessageSquare className="h-5 w-5 text-white" />
        <span>Chat IA</span>
      </button>

      <button
        onClick={() => onSectionChange('projects')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
          activeSection === 'projects'
            ? 'bg-white/6 text-white'
            : 'text-white/60 hover:bg-white/4'
        }`}
      >
        <FileText className="h-5 w-5 text-white" />
        <span>Proyectos</span>
      </button>
    </div>
  );
};
