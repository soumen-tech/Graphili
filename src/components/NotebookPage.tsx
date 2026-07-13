import React from 'react';

interface NotebookPageProps {
  tabLabel: string;
  children: React.ReactNode;
  showDecorations?: boolean;
  className?: string;
  showRuledLines?: boolean;
}

export const NotebookPage: React.FC<NotebookPageProps> = ({
  tabLabel,
  children,
  showDecorations = true,
  className = '',
  showRuledLines = true,
}) => {
  return (
    <div className="relative w-full">
      {/* Tab Label (top-left index tab) */}
      <div className="absolute top-0 left-10 z-30 transform -translate-y-1/2">
        <div className="bg-tab-navy text-white text-xs md:text-sm font-bold font-heading px-4 py-1.5 rounded-t-lg border-2 border-b-0 border-ink-primary shadow-sm tracking-wide">
          {tabLabel}
        </div>
      </div>

      <div className="relative min-h-[85vh] w-full bg-paper-card rounded-2xl shadow-xl border-2 border-ink-primary overflow-hidden flex flex-col md:flex-row transition-all duration-300">
        
        {/* Spiral Binder Rings (Left Edge) */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-paper-bg/40 border-r border-ink-primary/10 flex flex-col justify-around items-center py-8 z-20 pointer-events-none">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="relative w-8 h-6 flex items-center justify-start pl-1.5">
              {/* Paper Hole */}
              <div className="w-2.5 h-4 bg-ink-primary/20 rounded-full border border-ink-primary/10 shadow-inner"></div>
              {/* Coil ring */}
              <svg 
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-8 h-5 overflow-visible drop-shadow-[1.5px_2px_1px_rgba(0,0,0,0.18)]" 
                viewBox="0 0 32 20"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="metal-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#cfd6dc" />
                    <stop offset="50%" stopColor="#9ba3ab" />
                    <stop offset="100%" stopColor="#7a828a" />
                  </linearGradient>
                </defs>
                {/* Silver metal loop */}
                <path 
                  d="M 2 10 Q 14 0 26 10 Q 14 20 2 10 Z" 
                  fill="none" 
                  stroke="url(#metal-ring)" 
                  strokeWidth="3.2" 
                  strokeLinecap="round"
                />
                {/* Highlight line on metal */}
                <path 
                  d="M 6 8 Q 14 2 22 8" 
                  fill="none" 
                  stroke="#ffffff" 
                  strokeWidth="1.0" 
                  strokeLinecap="round"
                  strokeOpacity="0.75"
                />
              </svg>
            </div>
          ))}
        </div>

        {/* Main Ruled Paper Body */}
        <div className={`flex-1 relative pl-9 md:pl-10 p-6 md:p-8 flex flex-col ${showRuledLines ? 'ruled-lines' : ''} ${className}`}>
          
          {/* Notebook Vertical Margin Line */}
          <div className="absolute left-9 md:left-10 top-0 bottom-0 border-l border-accent-red-orange/25 pointer-events-none z-10" />

          {/* Paper Accessories (Doodles, clips, sticky note) */}
          {showDecorations && (
            <>
              {/* Top-Right Paper Clip */}
              <div className="absolute top-3 right-6 z-20 pointer-events-none">
                <svg 
                  className="w-10 h-10 drop-shadow-[1px_2.5px_1px_rgba(0,0,0,0.12)] rotate-12" 
                  viewBox="0 0 40 40"
                  fill="none"
                  aria-hidden="true"
                >
                  <path 
                    d="M12 18 L12 8 C12 4.7 14.7 2 18 2 C21.3 2 24 4.7 24 8 L24 28 C24 32.4 20.4 36 16 36 C11.6 36 8 32.4 8 28 L8 14 C8 11.2 10.2 9 13 9 C15.8 9 18 11.2 18 14 L18 26" 
                    stroke="#7A828A" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Corner Washi Tape Strip */}
              <div className="absolute top-1 right-20 z-10 pointer-events-none transform washi-tape-orange text-white text-[10px] font-handwritten px-4 py-0.5 select-none font-bold">
                Lab #04
              </div>

              {/* Subtle background pencil sketch doodles */}
              <div className="absolute bottom-6 right-8 opacity-[0.06] w-24 h-24 pointer-events-none select-none text-ink-primary font-handwritten">
                {/* Handdrawn Atom */}
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <ellipse cx="50" cy="50" rx="45" ry="15" transform="rotate(30 50 50)" />
                  <ellipse cx="50" cy="50" rx="45" ry="15" transform="rotate(-30 50 50)" />
                  <ellipse cx="50" cy="50" rx="45" ry="15" transform="rotate(90 50 50)" />
                  <circle cx="50" cy="50" r="6" fill="currentColor" />
                </svg>
              </div>
              
              <div className="absolute top-12 left-14 opacity-[0.05] w-20 h-20 pointer-events-none select-none text-ink-primary">
                {/* Handdrawn Protractor / Math grid */}
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M 10 50 A 40 40 0 0 1 90 50 Z" />
                  <line x1="10" y1="50" x2="90" y2="50" />
                  <line x1="50" y1="50" x2="50" y2="10" />
                  <line x1="50" y1="50" x2="21.7" y2="21.7" />
                  <line x1="50" y1="50" x2="78.3" y2="21.7" />
                </svg>
              </div>
            </>
          )}

          {/* Content Wrapper */}
          <div className="flex-1 z-10 flex flex-col pt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
