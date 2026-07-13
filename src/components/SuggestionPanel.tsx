import React from 'react';
import { Sparkles, BarChart2 } from 'lucide-react';

interface SuggestionPanelProps {
  data: { sNo: number; voltage: number; current: number }[];
  scaleX?: string;
  scaleY?: string;
  graphType?: string;
  formula?: string;
  confidence?: string;
  expectedOutcome?: string;
  col1Config?: { name: string; unit: string };
  col2Config?: { name: string; unit: string };
}

export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  data,
  scaleX = '1 cm = 1 V',
  scaleY = '1 cm = 10 mA',
  graphType = 'Linear Regression',
  formula = 'V = IR',
  confidence = '98%',
  expectedOutcome = 'A straight line passing through the origin, representing direct proportionality.',
  col1Config,
  col2Config,
}) => {
  // calculate averages
  const avgVoltage = data.length > 0 ? (data.reduce((sum, d) => sum + d.voltage, 0) / data.length).toFixed(2) : '0';
  const avgCurrent = data.length > 0 ? (data.reduce((sum, d) => sum + d.current, 0) / data.length).toFixed(2) : '0';
  
  const maxCol1 = data.length > 0 ? Math.max(...data.map(d => d.voltage)) : 5;
  const maxCol2 = data.length > 0 ? Math.max(...data.map(d => d.current)) : 50;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
      
      {/* Smart Suggestions Card */}
      <div className="flex-1 bg-paper-card p-5 rounded-xl border-2 border-ink-primary shadow-[3px_3px_0px_0px_rgba(44,62,80,1)] relative overflow-hidden">
        {/* Tape decoration */}
        <div className="absolute -top-1.5 left-4 w-12 h-3.5 bg-accent-orange/20 rotate-3"></div>
        
        <h4 className="text-sm font-bold font-heading text-accent-orange flex items-center gap-1.5 mb-4">
          <Sparkles className="w-4.5 h-4.5" /> Smart Suggestions
        </h4>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
          <div>
            <div className="font-heading font-bold text-ink-secondary">X-Axis ({col1Config?.name || 'Voltage'})</div>
            <div className="font-semibold text-ink-primary font-mono mt-0.5">0 to {maxCol1.toFixed(1)} {col1Config?.unit || 'V'}</div>
          </div>
          <div>
            <div className="font-heading font-bold text-ink-secondary">Y-Axis ({col2Config?.name || 'Current'})</div>
            <div className="font-semibold text-ink-primary font-mono mt-0.5">0 to {maxCol2.toFixed(0)} {col2Config?.unit || 'mA'}</div>
          </div>
          <div>
            <div className="font-heading font-bold text-ink-secondary">Scale (X-Axis)</div>
            <div className="font-semibold text-ink-primary font-mono mt-0.5">{scaleX}</div>
          </div>
          <div>
            <div className="font-heading font-bold text-ink-secondary">Scale (Y-Axis)</div>
            <div className="font-semibold text-ink-primary font-mono mt-0.5">{scaleY}</div>
          </div>
          <div>
            <div className="font-heading font-bold text-ink-secondary">Graph Type</div>
            <div className="font-semibold text-ink-primary mt-0.5">{graphType}</div>
          </div>
          <div>
            <div className="font-heading font-bold text-ink-secondary">Formula</div>
            <div className="font-semibold text-ink-primary font-mono mt-0.5">{formula}</div>
          </div>
          <div className="col-span-2 border-t border-ink-primary/5 pt-3 flex justify-between items-center">
            <span className="font-heading font-bold text-ink-secondary">AI OCR Confidence</span>
            <span className="font-bold text-success-green bg-success-green/10 px-2 py-0.5 rounded border border-success-green/20">
              {confidence}
            </span>
          </div>
        </div>
      </div>

      {/* Observation Summary Card */}
      <div className="flex-1 bg-paper-card p-5 rounded-xl border-2 border-ink-primary shadow-[3px_3px_0px_0px_rgba(44,62,80,1)] relative overflow-hidden">
        {/* Tape decoration */}
        <div className="absolute -top-1.5 left-4 w-12 h-3.5 bg-accent-blue/20 -rotate-3"></div>

        <h4 className="text-sm font-bold font-heading text-accent-blue flex items-center gap-1.5 mb-4">
          <BarChart2 className="w-4.5 h-4.5" /> Observation Summary
        </h4>

        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-ink-primary">
            <div>Total Readings:</div>
            <div className="font-mono text-right">{data.length}</div>
            <div>Missing Values:</div>
            <div className="font-mono text-right text-success-green">0</div>
            <div>Average {col2Config?.name || 'Current'}:</div>
            <div className="font-mono text-right">{avgCurrent} {col2Config?.unit || 'mA'}</div>
            <div>Average {col1Config?.name || 'Voltage'}:</div>
            <div className="font-mono text-right">{avgVoltage} {col1Config?.unit || 'V'}</div>
          </div>

          <div className="border-t border-ink-primary/5 pt-3">
            <div className="font-heading font-bold text-ink-secondary mb-1">Expected Outcome</div>
            <p className="text-xs font-semibold text-ink-primary leading-relaxed bg-paper-bg/30 p-2 rounded border border-ink-primary/5 font-body">
              {expectedOutcome}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
