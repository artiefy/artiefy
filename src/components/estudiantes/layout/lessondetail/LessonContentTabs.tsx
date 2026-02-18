'use client';

import { useRef, useState } from 'react';

export type TabType = 'transcription' | 'resources' | 'activities' | 'grades';

interface LessonContentTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  transcriptionCount?: number;
  resourcesCount?: number;
  activitiesCount?: number;
}

const LessonContentTabs = ({
  activeTab,
  onTabChange,
  transcriptionCount = 0,
  resourcesCount = 0,
  activitiesCount = 0,
}: LessonContentTabsProps) => {
  const navRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const scrollLeft = () => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };
  const tabs: Array<{
    id: TabType;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    {
      id: 'transcription' as const,
      label: 'Transcripción',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M10 9H8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        </svg>
      ),
      count: undefined, // Quitar número de transcripción
    },
    {
      id: 'resources' as const,
      label: 'Recursos',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
      ),
      count: resourcesCount > 0 ? resourcesCount : undefined,
    },
    {
      id: 'activities' as const,
      label: 'Actividades',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M12 11h4" />
          <path d="M12 16h4" />
          <path d="M8 11h.01" />
          <path d="M8 16h.01" />
        </svg>
      ),
      count: activitiesCount > 0 ? activitiesCount : undefined,
    },
    {
      id: 'grades' as const,
      label: 'Calificaciones',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <nav
        ref={navRef}
        className="flex items-center gap-2 overflow-x-auto px-10 lg:justify-start lg:px-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 rounded-full border px-[20px] py-[10px] text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'border-[hsl(217,33%,17%)] bg-[#061c37] text-white'
                : 'border-transparent bg-transparent text-white/80 hover:border-[hsl(217,33%,17%)]/60 hover:bg-[#061c3780]/50 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="inline-flex aspect-square h-6 w-6 justify-center rounded-full border border-white/20 bg-[#22C4D3] pt-[2.5px] text-xs text-black">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
      {/* Left Arrow */}
      <button
        onClick={scrollLeft}
        className={`absolute top-1/2 left-0 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-background/90 text-foreground shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-card lg:hidden ${
          isHovered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-chevron-left h-4 w-4"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      {/* Right Arrow */}
      <button
        onClick={scrollRight}
        className={`absolute top-1/2 right-0 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-background/90 text-foreground shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-card lg:hidden ${
          isHovered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-chevron-right h-4 w-4"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  );
};

export default LessonContentTabs;
