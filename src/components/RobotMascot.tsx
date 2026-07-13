import React from 'react';

interface RobotMascotProps {
  className?: string;
  expression?: 'normal' | 'thinking' | 'happy' | 'waving';
}

export const RobotMascot: React.FC<RobotMascotProps> = ({ 
  className = 'w-24 h-24', 
  expression = 'normal' 
}) => {
  return (
    <div className={`relative ${className} flex items-center justify-center select-none`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full overflow-visible drop-shadow-[2px_3px_2px_rgba(44,62,80,0.15)]"
      >
        {/* Antenna */}
        <line x1="50" y1="25" x2="50" y2="12" stroke="var(--color-ink-primary)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="10" r="4.5" fill="var(--color-accent-orange)" stroke="var(--color-ink-primary)" strokeWidth="2" />
        
        {/* Ears / Side antennas */}
        <rect x="23" y="32" width="6" height="12" rx="3" fill="var(--color-accent-blue)" stroke="var(--color-ink-primary)" strokeWidth="2" />
        <rect x="71" y="32" width="6" height="12" rx="3" fill="var(--color-accent-blue)" stroke="var(--color-ink-primary)" strokeWidth="2" />

        {/* Head */}
        <rect x="28" y="22" width="44" height="32" rx="10" fill="#ffffff" stroke="var(--color-ink-primary)" strokeWidth="2.5" />
        
        {/* Face Screen */}
        <rect x="34" y="28" width="32" height="20" rx="6" fill="var(--color-ink-primary)" />
        
        {/* Eyes (Glowing Light Blue) */}
        {expression === 'happy' && (
          <>
            {/* Happy arch eyes */}
            <path d="M 39 39 Q 43 35 47 39" fill="none" stroke="var(--color-accent-mint)" strokeWidth="3" strokeLinecap="round" />
            <path d="M 53 39 Q 57 35 61 39" fill="none" stroke="var(--color-accent-mint)" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        
        {expression === 'thinking' && (
          <>
            {/* Skeptical/Thinking eyes */}
            <line x1="39" y1="36" x2="47" y2="39" stroke="var(--color-accent-orange)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="57" cy="38" r="2.5" fill="var(--color-accent-orange)" />
          </>
        )}

        {(expression === 'normal' || expression === 'waving') && (
          <>
            {/* Normal round eyes */}
            <circle cx="43" cy="38" r="3" fill="var(--color-accent-blue)" className="animate-pulse" />
            <circle cx="57" cy="38" r="3" fill="var(--color-accent-blue)" className="animate-pulse" />
          </>
        )}

        {/* Small blushing cheeks */}
        <circle cx="38" cy="44" r="1.5" fill="var(--color-accent-red-orange)" fillOpacity="0.6" />
        <circle cx="62" cy="44" r="1.5" fill="var(--color-accent-red-orange)" fillOpacity="0.6" />

        {/* Neck */}
        <rect x="44" y="52" width="12" height="8" rx="2" fill="var(--color-spiral-metal)" stroke="var(--color-ink-primary)" strokeWidth="2" />

        {/* Body */}
        <rect x="32" y="58" width="36" height="30" rx="9" fill="#ffffff" stroke="var(--color-ink-primary)" strokeWidth="2.5" />
        {/* Core emblem on body */}
        <circle cx="50" cy="73" r="6" fill="var(--color-accent-blue)" fillOpacity="0.2" stroke="var(--color-accent-blue)" strokeWidth="1.5" />
        <circle cx="50" cy="73" r="2.5" fill="var(--color-accent-blue)" />

        {/* Arms */}
        {expression === 'waving' ? (
          <>
            {/* Waving left arm */}
            <path d="M 32 68 Q 20 62 16 50" fill="none" stroke="var(--color-ink-primary)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="48" r="3" fill="var(--color-accent-blue)" stroke="var(--color-ink-primary)" strokeWidth="2" />
            {/* Right arm normal */}
            <path d="M 68 68 Q 78 70 82 80" fill="none" stroke="var(--color-ink-primary)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="82" cy="81" r="3" fill="var(--color-accent-blue)" stroke="var(--color-ink-primary)" strokeWidth="2" />
          </>
        ) : (
          <>
            {/* Normal arms */}
            <path d="M 32 68 Q 22 70 18 80" fill="none" stroke="var(--color-ink-primary)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="18" cy="81" r="3" fill="var(--color-accent-blue)" stroke="var(--color-ink-primary)" strokeWidth="2" />
            
            <path d="M 68 68 Q 78 70 82 80" fill="none" stroke="var(--color-ink-primary)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="82" cy="81" r="3" fill="var(--color-accent-blue)" stroke="var(--color-ink-primary)" strokeWidth="2" />
          </>
        )}

        {/* Feet / Stubby legs */}
        <rect x="38" y="86" width="8" height="6" rx="2" fill="var(--color-spiral-metal)" stroke="var(--color-ink-primary)" strokeWidth="2" />
        <rect x="54" y="86" width="8" height="6" rx="2" fill="var(--color-spiral-metal)" stroke="var(--color-ink-primary)" strokeWidth="2" />
      </svg>
    </div>
  );
};
