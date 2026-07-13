import React from 'react';

interface TheorySidebarProps {
  sections: string[];
  activeSection: string;
  onSelect: (section: string) => void;
}

export const TheorySidebar: React.FC<TheorySidebarProps> = ({
  sections,
  activeSection,
  onSelect,
}) => {
  return (
    <div className="w-full md:w-48 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2.5 md:pb-0 border-b md:border-b-0 md:border-r border-ink-primary/10 pr-0 md:pr-4 select-none">
      {sections.map((section) => {
        const isActive = activeSection === section;
        return (
          <button
            key={section}
            onClick={() => onSelect(section)}
            className={`flex items-center text-xs md:text-sm font-bold font-heading px-3 py-2 rounded-lg transition-all text-left whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/40 shadow-[1.5px_1.5px_0px_0px_rgba(74,144,196,0.2)]'
                : 'text-ink-primary hover:bg-ink-primary/5 border border-transparent'
            }`}
          >
            <div className={`w-2 h-2 rounded-full mr-2.5 ${isActive ? 'bg-accent-blue animate-pulse' : 'bg-ink-secondary/35'}`}></div>
            <span>{section}</span>
          </button>
        );
      })}
    </div>
  );
};
