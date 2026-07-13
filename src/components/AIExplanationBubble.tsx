import React from 'react';
import { RobotMascot } from './RobotMascot';
import { AlertCircle } from 'lucide-react';

interface AIExplanationBubbleProps {
  title: string;
  bubbleText: string;
  commonMistakes: string[];
}

export const AIExplanationBubble: React.FC<AIExplanationBubbleProps> = ({
  title,
  bubbleText,
  commonMistakes,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      
      {/* Robot Mascot Panel */}
      <div className="flex flex-col items-center shrink-0 w-full md:w-32 bg-paper-card p-4 rounded-xl border border-ink-primary/10 shadow-[2px_2px_0px_0px_rgba(44,62,80,0.15)] relative">
        <div className="absolute -top-1.5 left-3 w-8 h-3 bg-accent-mint/30 rotate-3"></div>
        <RobotMascot expression="happy" className="w-18 h-18" />
        <span className="text-[10px] font-bold text-accent-blue mt-1.5 uppercase tracking-wider font-heading">
          Lab Assistant
        </span>
      </div>

      {/* Bubble / Explanation box */}
      <div className="flex-1 flex flex-col gap-4 w-full">
        {/* Chat Speech Bubble */}
        <div className="relative bg-paper-card p-5 rounded-2xl border-2 border-ink-primary shadow-[3px_3px_0px_0px_rgba(44,62,80,1)]">
          {/* Triangular arrow on left (md) or top (sm) */}
          <div className="absolute hidden md:block left-[-10px] top-8 w-4 h-4 bg-paper-card border-l-2 border-b-2 border-ink-primary transform rotate-45"></div>
          
          <h3 className="text-sm font-bold font-heading text-ink-primary mb-2 flex items-center gap-1.5">
            {title}
          </h3>
          <p className="text-xs md:text-sm text-ink-primary font-body leading-relaxed">
            {bubbleText}
          </p>
        </div>

        {/* Common Mistakes */}
        <div className="bg-accent-red-orange/5 rounded-xl border-2 border-ink-primary p-4 shadow-[2.5px_2.5px_0px_0px_rgba(44,62,80,0.15)]">
          <h4 className="text-xs md:text-sm font-bold font-heading text-accent-red-orange flex items-center gap-1.5 mb-2.5">
            <AlertCircle className="w-4.5 h-4.5" /> Common Student Mistakes:
          </h4>
          <ul className="list-disc list-inside space-y-1.5 pl-1.5">
            {commonMistakes.map((mistake, idx) => (
              <li key={idx} className="text-xs text-ink-primary font-semibold font-body leading-normal">
                {mistake}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
};
