import React from 'react';
import { Search, Compass, Cpu, Award, User, Settings, CheckCircle2, CloudUpload, FileDown } from 'lucide-react';

// Buttons
export const PrimaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, className = '', disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 bg-accent-orange hover:bg-accent-orange-dark text-white font-heading font-semibold rounded-xl border-2 border-ink-primary shadow-[2px_2px_0px_0px_rgba(44,62,80,1)] hover:shadow-[1px_1px_0px_0px_rgba(44,62,80,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all btn-animate flex items-center justify-center gap-2 cursor-pointer ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

export const SecondaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, className = '', disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 bg-transparent text-ink-primary hover:bg-ink-primary/5 font-heading font-semibold rounded-xl border-2 border-ink-primary hover:translate-y-[-1px] transition-all btn-animate flex items-center justify-center gap-2 cursor-pointer ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

// StatCard (Dashboard and Profile)
export const StatCard: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  borderColor?: string;
}> = ({ icon, value, label, borderColor = 'border-ink-primary' }) => {
  return (
    <div className={`bg-paper-card p-4 rounded-xl border-2 ${borderColor} shadow-[3px_3px_0px_0px_rgba(44,62,80,0.15)] flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
      {/* Tape decoration */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-accent-blue/20 rotate-2"></div>
      
      <div className="text-accent-orange mb-1.5 p-2 bg-paper-bg/40 rounded-full border border-ink-primary/5">
        {icon}
      </div>
      <div className="text-2xl md:text-3xl font-bold font-heading text-ink-primary">{value}</div>
      <div className="text-xs font-semibold text-ink-secondary mt-1">{label}</div>
    </div>
  );
};

// SearchBar
export const SearchBar: React.FC<{
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  className?: string;
}> = ({ placeholder = 'Search...', value, onChange, className = '' }) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 w-5 h-5 text-ink-secondary" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-paper-card border-2 border-ink-primary rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange/30 shadow-[2px_2px_0px_0px_rgba(44,62,80,0.15)]"
      />
    </div>
  );
};

// Sidebar Navigation
export const SidebarNav: React.FC<{
  activeItem: string;
  onSelect: (item: string) => void;
}> = ({ activeItem, onSelect }) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: <Compass className="w-5 h-5" /> },
    { id: 'subjects', label: 'Select Subject', icon: <Cpu className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <FileDown className="w-5 h-5" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="w-full md:w-56 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 border-b md:border-b-0 md:border-r border-ink-primary/10 pr-0 md:pr-4 select-none">
      {items.map((item) => {
        const isActive = activeItem === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-accent-orange/15 text-accent-orange border-2 border-accent-orange shadow-[2px_2px_0px_0px_rgba(242,137,78,0.2)]'
                : 'text-ink-primary hover:bg-ink-primary/5 border-2 border-transparent'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// SubjectCard
export const SubjectCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  subjectColor: 'physics' | 'electronics' | 'electrical';
  onClick: () => void;
}> = ({ title, description, icon, subjectColor, onClick }) => {
  const colorMap = {
    physics: {
      bg: 'bg-accent-blue/10',
      border: 'border-accent-blue hover:bg-accent-blue/15',
      text: 'text-accent-blue',
      shadow: 'rgba(74, 144, 196, 1)',
    },
    electronics: {
      bg: 'bg-accent-mint/10',
      border: 'border-accent-mint hover:bg-accent-mint/15',
      text: 'text-accent-mint',
      shadow: 'rgba(127, 200, 160, 1)',
    },
    electrical: {
      bg: 'bg-accent-red-orange/10',
      border: 'border-accent-red-orange hover:bg-accent-red-orange/15',
      text: 'text-accent-red-orange',
      shadow: 'rgba(232, 115, 74, 1)',
    },
  };

  const scheme = colorMap[subjectColor];

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl border-2 border-ink-primary bg-paper-card cursor-pointer transform hover:scale-[1.03] transition-all flex flex-col items-center text-center shadow-[4px_4px_0px_0px_rgba(44,62,80,1)] group`}
    >
      <div className={`p-4 rounded-2xl mb-4 border-2 border-ink-primary ${scheme.bg} ${scheme.text} group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(44,62,80,1)]`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold font-heading text-ink-primary mb-2">{title}</h3>
      <p className="text-xs text-ink-secondary leading-relaxed font-body">{description}</p>
    </div>
  );
};

// ExperimentCard
export const ExperimentCard: React.FC<{
  title: string;
  timestamp: string;
  isPopular?: boolean;
  onClick: () => void;
}> = ({ title, timestamp, isPopular = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 bg-paper-card hover:bg-paper-card/70 border-2 border-ink-primary rounded-xl cursor-pointer hover:scale-[1.02] transition-all shadow-[2px_2px_0px_0px_rgba(44,62,80,1)] flex flex-col justify-between min-h-[90px] relative group overflow-hidden`}
    >
      {/* Mini paper clip style */}
      <div className="absolute top-1 right-2 w-3 h-1.5 border border-ink-secondary/30 rounded-t-full bg-paper-bg/50"></div>
      
      <div>
        <h4 className="text-sm font-bold font-heading text-ink-primary line-clamp-2 leading-snug">{title}</h4>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-[10px] font-semibold text-ink-secondary">{timestamp}</span>
        {isPopular && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent-orange/15 text-accent-orange border border-accent-orange/30">
            Popular
          </span>
        )}
      </div>
    </div>
  );
};

// AchievementBadge
export const AchievementBadge: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
}> = ({ title, description, icon, unlocked }) => {
  return (
    <div className={`p-4 rounded-xl border-2 border-ink-primary flex items-center gap-4 bg-paper-card relative transition-all ${unlocked ? 'opacity-100 shadow-[3px_3px_0px_0px_rgba(44,62,80,1)]' : 'opacity-65 bg-paper-bg/40'}`}>
      
      {/* Circular Badge Outer */}
      <div className={`w-12 h-12 rounded-full border-2 border-ink-primary flex items-center justify-center relative shrink-0 ${unlocked ? 'bg-star-gold text-ink-primary' : 'bg-ink-secondary/10 text-ink-secondary'}`}>
        {icon}
        {unlocked && (
          <div className="absolute -top-1.5 -right-1.5 bg-success-green text-white p-0.5 rounded-full border border-ink-primary">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-bold font-heading text-ink-primary leading-tight">{title}</h4>
        <p className="text-[11px] text-ink-secondary mt-0.5 leading-normal">{description}</p>
      </div>

      {!unlocked && (
        <div className="absolute inset-0 bg-ink-primary/[0.02] pointer-events-none rounded-xl"></div>
      )}
    </div>
  );
};

// ToggleRow
export const ToggleRow: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink-primary/5">
      <div className="flex-1 pr-4">
        <div className="text-sm font-bold font-heading text-ink-primary">{label}</div>
        <div className="text-xs text-ink-secondary mt-0.5 leading-relaxed">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer border border-ink-primary transition-all duration-300 ${checked ? 'bg-success-green' : 'bg-ink-secondary/20'}`}
      >
        <div className={`bg-white w-4.5 h-4.5 rounded-full shadow border border-ink-primary transition-transform duration-300 transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </button>
    </div>
  );
};

// UploadDropzone
export const UploadDropzone: React.FC<{
  onUploadStart: () => void;
  onUpload?: (file: File) => void;
  onPasteText?: (text: string) => void;
}> = ({ onUploadStart, onUpload, onPasteText }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (onUpload) onUpload(e.target.files[0]);
      onUploadStart();
    }
  };

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    cameraInputRef.current?.click();
  };

  // Check if text looks like a table (tab or comma-separated with multiple rows)
  const isStructuredText = (text: string): boolean => {
    const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return false;
    // Check if at least 2 lines have tabs or commas as delimiters
    const hasDelimiters = lines.filter(l => l.includes('\t') || l.includes(',')).length >= 2;
    return hasDelimiters;
  };

  const handlePasteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        // Check for images first
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], 'pasted-image.png', { type });
            if (onUpload) {
              onUpload(file);
              onUploadStart();
            }
            return;
          }
        }
        // Check for text (structured table data from Excel/Sheets)
        for (const type of item.types) {
          if (type === 'text/plain') {
            const blob = await item.getType(type);
            const text = await blob.text();
            if (isStructuredText(text) && onPasteText) {
              onPasteText(text);
              return;
            }
          }
        }
      }
      alert("No image or table data found in your clipboard. Please copy an image or table first, then paste it here.");
    } catch (_err) {
      // Fallback: try reading text from clipboard
      try {
        const text = await navigator.clipboard.readText();
        if (text && isStructuredText(text) && onPasteText) {
          onPasteText(text);
          return;
        }
      } catch (_e2) { /* ignore */ }
      alert("Clipboard access was blocked or is not supported by your browser. Please copy an image, select this page, and press Ctrl + V (or Cmd + V) to paste.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        if (onUpload) onUpload(file);
        onUploadStart();
      } else {
        alert("Only image files are supported.");
      }
    }
  };

  // Keyboard paste listener (Ctrl+V / Cmd+V)
  React.useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // Check for images first
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            if (onUpload) onUpload(file);
            onUploadStart();
            return;
          }
        }
      }

      // Check for structured text
      for (let i = 0; i < items.length; i++) {
        if (items[i].type === 'text/plain') {
          items[i].getAsString((text) => {
            if (isStructuredText(text) && onPasteText) {
              onPasteText(text);
            }
          });
          return;
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [onUpload, onUploadStart, onPasteText]);

  return (
    <div 
      onClick={handleDivClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="p-8 border-2 border-dashed border-ink-secondary/40 hover:border-accent-orange/60 rounded-2xl bg-paper-bg/20 hover:bg-paper-bg/40 transition-colors flex flex-col items-center justify-center text-center cursor-pointer group py-12 relative"
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />
      <div className="p-4 bg-paper-card rounded-full border border-ink-primary/10 shadow-sm group-hover:scale-105 transition-transform mb-4 text-accent-orange">
        <CloudUpload className="w-10 h-10" />
      </div>
      <h3 className="text-base font-bold font-heading text-ink-primary mb-1">Drag & Drop your image here</h3>
      <p className="text-xs text-ink-secondary mb-6">or browse files from your computer</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button onClick={handleCameraClick} className="px-4 py-1.5 bg-paper-card border border-ink-primary rounded-lg text-xs font-bold text-ink-primary hover:bg-ink-primary/5 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer">
          📷 Camera
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleDivClick(); }} className="px-4 py-1.5 bg-accent-orange text-white border border-ink-primary rounded-lg text-xs font-bold hover:bg-accent-orange-dark transition-all shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer">
          📁 Browse Files
        </button>
        <button onClick={handlePasteClick} className="px-4 py-1.5 bg-paper-card border border-ink-primary rounded-lg text-xs font-bold text-ink-primary hover:bg-ink-primary/5 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer">
          📋 Paste Image / Table
        </button>
      </div>
      
      <p className="text-[10px] text-ink-secondary/70 mt-6 font-semibold">Supports: JPG, PNG, JPEG (Max 10MB) • Ctrl+V to paste image or table data from Excel/Sheets</p>
    </div>
  );
};

// AIProcessingChecklist
export const AIProcessingChecklist: React.FC<{
  currentStep: number;
  progress: number;
  errorMessage?: string | null;
  onRetry?: () => void;
  onReupload?: () => void;
}> = ({ currentStep, progress, errorMessage, onRetry, onReupload }) => {
  const steps = [
    'Reading image...',
    'Extracting values...',
    'Detecting rows...',
    'Checking accuracy...',
    'Formatting data...',
    'Almost done...',
  ];

  // Error state UI
  if (errorMessage) {
    return (
      <div className="w-full max-w-sm flex flex-col gap-4 items-center">
        <div className="p-4 bg-accent-red-orange/10 border-2 border-accent-red-orange rounded-xl text-center">
          <div className="text-2xl mb-2">😔</div>
          <h4 className="text-sm font-bold font-heading text-accent-red-orange mb-2">Processing Failed</h4>
          <p className="text-xs font-semibold text-ink-primary leading-relaxed mb-4">
            {errorMessage}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {onRetry && (
              <button 
                onClick={onRetry}
                className="px-4 py-2 bg-accent-orange text-white border border-ink-primary rounded-lg text-xs font-bold hover:bg-accent-orange-dark transition-all shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
              >
                🔄 Retry
              </button>
            )}
            {onReupload && (
              <button 
                onClick={onReupload}
                className="px-4 py-2 bg-paper-card border border-ink-primary rounded-lg text-xs font-bold text-ink-primary hover:bg-ink-primary/5 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
              >
                📤 Re-upload Photo
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-4">
      {/* Progress checklist */}
      <div className="flex flex-col gap-2.5 text-left">
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${
                isDone 
                  ? 'text-success-green opacity-100' 
                  : isCurrent 
                    ? 'text-ink-primary animate-pulse opacity-100' 
                    : 'text-ink-secondary/40 opacity-70'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 ${isDone ? 'bg-success-green/10 border-success-green text-success-green' : 'border-ink-primary/20 bg-paper-bg/30 text-transparent'}`}>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <span className={isDone ? 'line-through decoration-success-green/40' : ''}>{step}</span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar & Mascot */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-xs font-bold text-ink-secondary mb-1.5 pr-1">
          <span>Processing table data</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-3 bg-paper-bg/80 border-2 border-ink-primary rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-accent-blue rounded-full transition-all duration-300 border border-ink-primary/10 shadow-inner"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

