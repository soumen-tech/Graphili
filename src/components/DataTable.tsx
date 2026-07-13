import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Undo, Redo, FileDown, Check } from 'lucide-react';
import { PrimaryButton } from './CommonComponents';

export interface DataRow {
  sNo: number;
  voltage: number;
  current: number;
  voltageLowConfidence?: boolean;
  currentLowConfidence?: boolean;
}

interface DataTableProps {
  data: DataRow[];
  onChange: (newData: DataRow[]) => void;
  onSave: () => void;
  col1Config: { name: string; unit: string; availableUnits: string[] };
  setCol1Config: React.Dispatch<React.SetStateAction<{ name: string; unit: string; availableUnits: string[] }>>;
  col2Config: { name: string; unit: string; availableUnits: string[] };
  setCol2Config: React.Dispatch<React.SetStateAction<{ name: string; unit: string; availableUnits: string[] }>>;
}

export const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  onChange, 
  onSave,
  col1Config,
  setCol1Config,
  col2Config,
  setCol2Config
}) => {
  const [history, setHistory] = useState<DataRow[][]>([data]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const lastExternalData = useRef(JSON.stringify(data));

  // Reset history when the parent provides genuinely new data
  // (e.g., after OCR result or CSV import)
  useEffect(() => {
    const serialized = JSON.stringify(data);
    if (serialized !== lastExternalData.current) {
      lastExternalData.current = serialized;
      setHistory([data]);
      setHistoryIndex(0);
    }
  }, [data]);

  const updateData = (newData: DataRow[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newData);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    onChange(newData);
  };

  const handleCellChange = (index: number, field: 'voltage' | 'current', val: string) => {
    const numVal = parseFloat(val) || 0;
    const newData = data.map((row, i) => {
      if (i === index) {
        return { 
          ...row, 
          [field]: numVal,
          [`${field}LowConfidence`]: false // clear low confidence flag on edit
        };
      }
      return row;
    });
    updateData(newData);
  };

  const addRow = () => {
    const nextSNo = data.length + 1;
    const nextVoltage = data.length > 0 ? data[data.length - 1].voltage + 1 : 0;
    const nextCurrent = Number((nextVoltage * 10).toFixed(1)); 
    const newRow: DataRow = { sNo: nextSNo, voltage: nextVoltage, current: nextCurrent };
    updateData([...data, newRow]);
  };

  const deleteRow = () => {
    if (data.length <= 1) return;
    const newData = data.slice(0, -1);
    updateData(newData);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      onChange(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      onChange(history[nextIndex]);
    }
  };

  const handleImportCSV = () => {
    // Generate pre-loaded LCR circuit or Ohm's Law dataset to simulate CSV upload
    const mockCSVData: DataRow[] = [
      { sNo: 1, voltage: 0.5, current: 4.8 },
      { sNo: 2, voltage: 1.2, current: 12.1 },
      { sNo: 3, voltage: 2.0, current: 20.3, voltageLowConfidence: true },
      { sNo: 4, voltage: 2.8, current: 28.2 },
      { sNo: 5, voltage: 3.5, current: 34.9, currentLowConfidence: true },
      { sNo: 6, voltage: 4.2, current: 42.0 },
      { sNo: 7, voltage: 5.0, current: 50.2 },
    ];
    updateData(mockCSVData);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Table Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-paper-bg/40 p-2.5 rounded-xl border border-ink-primary/15">
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1 px-3 py-1.5 bg-paper-card border-2 border-ink-primary hover:bg-ink-primary/5 rounded-lg text-xs font-bold text-ink-primary shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-success-green" /> Add Row
          </button>
          <button
            onClick={deleteRow}
            disabled={data.length <= 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-paper-card border-2 border-ink-primary hover:bg-ink-primary/5 rounded-lg text-xs font-bold text-ink-primary shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-accent-red-orange" /> Delete Row
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-1.5 bg-paper-card border-2 border-ink-primary hover:bg-ink-primary/5 rounded-lg text-ink-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            className="p-1.5 bg-paper-card border-2 border-ink-primary hover:bg-ink-primary/5 rounded-lg text-ink-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
          
          <div className="h-6 w-px bg-ink-primary/20 mx-1"></div>
          
          <button
            onClick={handleImportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-card border-2 border-ink-primary hover:bg-ink-primary/5 rounded-lg text-xs font-bold text-ink-primary shadow-[1.5px_1.5px_0px_0px_rgba(44,62,80,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-accent-blue" /> Import CSV
          </button>
        </div>
      </div>

      {/* Main Grid table */}
      <div className="overflow-x-auto border-2 border-ink-primary rounded-xl shadow-[3px_3px_0px_0px_rgba(44,62,80,1)]">
        <table className="w-full border-collapse bg-paper-card text-left font-body text-xs md:text-sm">
          <thead>
            <tr className="bg-paper-bg/60 border-b-2 border-ink-primary text-ink-primary font-heading font-bold">
              <th className="px-4 py-3 border-r-2 border-ink-primary w-16 text-center">S.No.</th>
              <th className="px-6 py-3 border-r-2 border-ink-primary">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={col1Config.name}
                    onChange={(e) => setCol1Config({ ...col1Config, name: e.target.value })}
                    className="bg-transparent font-heading font-bold text-xs md:text-sm border-b border-dashed border-ink-primary/30 focus:border-accent-orange focus:outline-none w-28 py-0.5 text-ink-primary"
                    title="Click to rename column"
                  />
                  <select
                    value={col1Config.unit}
                    onChange={(e) => setCol1Config({ ...col1Config, unit: e.target.value })}
                    className="bg-white border border-ink-primary/20 rounded py-0.5 px-1 font-mono text-[10px] focus:outline-none cursor-pointer text-ink-primary"
                  >
                    {col1Config.availableUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="px-6 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={col2Config.name}
                    onChange={(e) => setCol2Config({ ...col2Config, name: e.target.value })}
                    className="bg-transparent font-heading font-bold text-xs md:text-sm border-b border-dashed border-ink-primary/30 focus:border-accent-orange focus:outline-none w-28 py-0.5 text-ink-primary"
                    title="Click to rename column"
                  />
                  <select
                    value={col2Config.unit}
                    onChange={(e) => setCol2Config({ ...col2Config, unit: e.target.value })}
                    className="bg-white border border-ink-primary/20 rounded py-0.5 px-1 font-mono text-[10px] focus:outline-none cursor-pointer text-ink-primary"
                  >
                    {col2Config.availableUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y border-ink-primary divide-ink-primary/10">
            {data.map((row, idx) => (
              <tr key={row.sNo} className="hover:bg-paper-bg/10">
                <td className="px-4 py-2.5 border-r-2 border-ink-primary font-bold text-center bg-paper-bg/25">
                  {row.sNo}
                </td>
                <td className="px-6 py-2.5 border-r-2 border-ink-primary">
                  <div className="relative flex items-center group/cell">
                    <input
                      type="number"
                      step="any"
                      value={row.voltage}
                      onChange={(e) => handleCellChange(idx, 'voltage', e.target.value)}
                      className={`w-full bg-transparent border-b border-transparent focus:border-accent-orange font-mono text-sm focus:outline-none py-0.5 ${
                        row.voltageLowConfidence ? 'border-b border-dashed border-amber-500 bg-amber-500/5' : ''
                      }`}
                    />
                    {row.voltageLowConfidence && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center z-10">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span className="hidden group-hover/cell:block absolute right-4 bottom-1 bg-ink-primary text-white text-[9px] font-bold py-0.5 px-1.5 rounded whitespace-nowrap shadow-md">
                          Low OCR Confidence
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-2.5">
                  <div className="relative flex items-center group/cell">
                    <input
                      type="number"
                      step="any"
                      value={row.current}
                      onChange={(e) => handleCellChange(idx, 'current', e.target.value)}
                      className={`w-full bg-transparent border-b border-transparent focus:border-accent-orange font-mono text-sm focus:outline-none py-0.5 ${
                        row.currentLowConfidence ? 'border-b border-dashed border-amber-500 bg-amber-500/5' : ''
                      }`}
                    />
                    {row.currentLowConfidence && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center z-10">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span className="hidden group-hover/cell:block absolute right-4 bottom-1 bg-ink-primary text-white text-[9px] font-bold py-0.5 px-1.5 rounded whitespace-nowrap shadow-md">
                          Low OCR Confidence
                        </span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save CTA */}
      <div className="flex justify-end mt-2">
        <PrimaryButton onClick={onSave} className="w-full sm:w-auto">
          Save & Continue <Check className="w-4 h-4" />
        </PrimaryButton>
      </div>
    </div>
  );
};
