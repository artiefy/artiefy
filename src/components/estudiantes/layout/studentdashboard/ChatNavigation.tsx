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
    <div className="flex items-center justify-around border-b border-gray-200 bg-white p-2">
      <button
        onClick={() => onSectionChange('tickets')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
          activeSection === 'tickets'
            ? 'bg-purple-100 text-purple-700'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Ticket className="h-5 w-5" />
        <span>Tickets</span>
      </button>

      <button
        onClick={() => onSectionChange('chatia')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
          activeSection === 'chatia'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <MessageSquare className="h-5 w-5" />
        <span>Chat IA</span>
      </button>

      <button
        onClick={() => onSectionChange('projects')}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
          activeSection === 'projects'
            ? 'bg-green-100 text-green-700'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <FileText className="h-5 w-5" />
        <span>Proyectos</span>
      </button>
    </div>
  );
};
