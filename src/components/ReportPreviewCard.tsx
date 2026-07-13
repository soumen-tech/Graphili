import React, { useState } from 'react';
import { Download, FileDown, Check, Copy, MessageSquare, Mail } from 'lucide-react';
import { PrimaryButton } from './CommonComponents';

interface ReportPreviewCardProps {
  experimentName: string;
  data: { sNo: number; voltage: number; current: number }[];
  aim: string;
  formula: string;
  col1Config?: { name: string; unit: string };
  col2Config?: { name: string; unit: string };
}

export const ReportPreviewCard: React.FC<ReportPreviewCardProps> = ({
  experimentName,
  data,
  aim,
  formula,
  col1Config,
  col2Config,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    setCopied(true);
    navigator.clipboard.writeText('https://graphlab.ai/report/shared_report_79234');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
      
      {/* Mini Report Preview Page (Left Side) */}
      <div className="flex-1 bg-white border-2 border-ink-primary rounded-xl shadow-[3px_3px_0px_0px_rgba(44,62,80,1)] p-6 relative overflow-hidden font-body text-xs text-ink-primary min-h-[300px]">
        
        {/* Paper style header stamp */}
        <div className="absolute top-2 right-4 text-[9px] font-bold text-ink-secondary/50 border border-ink-primary/20 px-2 py-0.5 rounded tracking-widest uppercase">
          Draft Copy
        </div>

        <h3 className="text-base font-bold font-heading border-b border-ink-primary/10 pb-2 mb-4 text-center">
          LABORATORY WORK REPORT
        </h3>

        <div className="space-y-4">
          <div>
            <div className="font-heading font-bold text-xs text-ink-secondary uppercase tracking-wider mb-0.5">Experiment Title</div>
            <div className="font-bold text-sm text-accent-blue">{experimentName}</div>
          </div>

          <div>
            <div className="font-heading font-bold text-xs text-ink-secondary uppercase tracking-wider mb-0.5">Aim</div>
            <div className="font-medium text-xs leading-relaxed">{aim}</div>
          </div>

          <div>
            <div className="font-heading font-bold text-xs text-ink-secondary uppercase tracking-wider mb-0.5">Mathematical Formula</div>
            <div className="font-mono text-sm py-1 px-3 bg-paper-bg/40 border border-ink-primary/5 rounded inline-block">
              {formula}
            </div>
          </div>

          <div>
            <div className="font-heading font-bold text-xs text-ink-secondary uppercase tracking-wider mb-1">Extracted Table Summary</div>
            <div className="font-mono text-[10px] text-ink-secondary bg-paper-card/60 p-2 rounded border border-ink-primary/10 leading-normal">
              - Record count: {data.length} readings<br />
              - Min value: {data[0]?.voltage || 0} {col1Config?.unit || 'V'}, {data[0]?.current || 0} {col2Config?.unit || 'mA'}<br />
              - Max value: {data[data.length - 1]?.voltage || 0} {col1Config?.unit || 'V'}, {data[data.length - 1]?.current || 0} {col2Config?.unit || 'mA'}
            </div>
          </div>
        </div>
      </div>

      {/* Download & Share Panels (Right Side) */}
      <div className="w-full lg:w-72 flex flex-col gap-4">
        
        {/* Download Section */}
        <div className="bg-paper-card p-4 rounded-xl border-2 border-ink-primary shadow-[2.5px_2.5px_0px_0px_rgba(44,62,80,0.15)]">
          <h4 className="text-xs font-bold font-heading text-ink-secondary uppercase tracking-wider mb-3">Download Report</h4>
          <div className="flex flex-col gap-2">
            <PrimaryButton className="w-full text-xs font-bold py-2 bg-accent-orange text-white" onClick={() => alert('Downloading PDF Report...')}>
              <Download className="w-4 h-4" /> Download PDF
            </PrimaryButton>
            <button onClick={() => alert('Downloading Word Document...')} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-ink-primary rounded-lg text-xs font-bold text-ink-primary hover:bg-ink-primary/5 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer bg-white">
              <FileDown className="w-4 h-4 text-accent-blue" /> Download DOCX
            </button>
            <button onClick={() => alert('Downloading PNG Image...')} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-ink-primary rounded-lg text-xs font-bold text-ink-primary hover:bg-ink-primary/5 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer bg-white">
              <FileDown className="w-4 h-4 text-accent-mint" /> Download PNG
            </button>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-paper-card p-4 rounded-xl border-2 border-ink-primary shadow-[2.5px_2.5px_0px_0px_rgba(44,62,80,0.15)]">
          <h4 className="text-xs font-bold font-heading text-ink-secondary uppercase tracking-wider mb-3">Share Report</h4>
          <div className="flex flex-col gap-2">
            <button 
              onClick={handleCopyLink} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-ink-primary rounded-lg text-xs font-bold text-ink-primary hover:bg-ink-primary/5 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer bg-white"
            >
              {copied ? <Check className="w-4 h-4 text-success-green" /> : <Copy className="w-4 h-4 text-ink-secondary" />}
              {copied ? 'Link Copied!' : 'Copy Shareable Link'}
            </button>
            <button onClick={() => alert('Opening WhatsApp share dialog...')} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-ink-primary rounded-lg text-xs font-bold text-ink-primary hover:bg-ink-primary/5 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer bg-white">
              <MessageSquare className="w-4 h-4 text-success-green" /> Share on WhatsApp
            </button>
            <button onClick={() => alert('Opening Email share dialog...')} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-ink-primary rounded-lg text-xs font-bold text-ink-primary hover:bg-ink-primary/5 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer bg-white">
              <Mail className="w-4 h-4 text-accent-red-orange" /> Share via Email
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
