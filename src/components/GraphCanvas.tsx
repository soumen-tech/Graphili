import { useMemo } from 'react';

interface GraphCanvasProps {
  data: { sNo: number; voltage: number; current: number }[];
  showGrid: boolean;
  showBestFit: boolean;
  zoomLevel: number;
  col1Config?: { name: string; unit: string };
  col2Config?: { name: string; unit: string };
}

export const GraphCanvas = ({
  data,
  showGrid,
  showBestFit,
  zoomLevel: _zoomLevel,
  col1Config,
  col2Config,
}: GraphCanvasProps) => {
  // SVG size parameters
  const width = 500;
  const height = 350;
  const paddingLeft = 50;
  const paddingBottom = 45;
  const paddingTop = 25;
  const paddingRight = 25;

  // Find data ranges
  const maxVoltage = useMemo(() => Math.max(...data.map(d => d.voltage), 5), [data]);
  const maxCurrent = useMemo(() => Math.max(...data.map(d => d.current), 50), [data]);

  // Linear Regression (y = mx + c)
  const regression = useMemo(() => {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;
    
    data.forEach(d => {
      sumX += d.voltage;
      sumY += d.current;
      sumXY += d.voltage * d.current;
      sumXX += d.voltage * d.voltage;
      sumYY += d.current * d.current;
    });
    
    const slopeNum = (n * sumXY) - (sumX * sumY);
    const slopeDen = (n * sumXX) - (sumX * sumX);
    const slope = slopeDen !== 0 ? slopeNum / slopeDen : 0;
    const intercept = (sumY - (slope * sumX)) / n;
    
    return { slope, intercept };
  }, [data]);

  // Coordinate Conversion Functions
  const getX = (voltage: number) => {
    const range = maxVoltage * 1.15; // padding factor
    const scale = (width - paddingLeft - paddingRight) / range;
    return paddingLeft + voltage * scale;
  };

  const getY = (current: number) => {
    const range = maxCurrent * 1.15;
    const scale = (height - paddingTop - paddingBottom) / range;
    return height - paddingBottom - current * scale;
  };

  // Generate grid ticks
  const xTicks = useMemo(() => {
    const steps = 6;
    return Array.from({ length: steps }).map((_, i) => (maxVoltage / (steps - 1)) * i);
  }, [maxVoltage]);

  const yTicks = useMemo(() => {
    const steps = 6;
    return Array.from({ length: steps }).map((_, i) => (maxCurrent / (steps - 1)) * i);
  }, [maxCurrent]);

  return (
    <div className="relative w-full border-2 border-ink-primary bg-paper-card rounded-xl shadow-[3px_3px_0px_0px_rgba(44,62,80,1)] overflow-hidden">
      
      {/* Tape style title indicator */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-accent-blue/15 text-accent-blue text-[10px] font-bold px-3 py-0.5 rounded border border-accent-blue/30 uppercase tracking-widest z-10 font-heading">
        Interactive Graph Canvas
      </div>

      <div className="p-3 bg-white">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Grid lines */}
          {showGrid && (
            <g stroke="rgba(74, 144, 196, 0.15)" strokeWidth="1" strokeDasharray="3 3">
              {xTicks.map((tick, i) => (
                <line 
                  key={`v-grid-${i}`}
                  x1={getX(tick)} 
                  y1={paddingTop} 
                  x2={getX(tick)} 
                  y2={height - paddingBottom} 
                />
              ))}
              {yTicks.map((tick, i) => (
                <line 
                  key={`h-grid-${i}`}
                  x1={paddingLeft} 
                  y1={getY(tick)} 
                  x2={width - paddingRight} 
                  y2={getY(tick)} 
                />
              ))}
            </g>
          )}

          {/* Axes */}
          <g stroke="var(--color-ink-primary)" strokeWidth="2.5">
            {/* X Axis */}
            <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} />
            {/* Y Axis */}
            <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} />
          </g>

          {/* Axis Ticks & Text */}
          <g fill="var(--color-ink-primary)" className="font-mono text-[9px] font-bold">
            {/* X-axis Ticks */}
            {xTicks.map((tick, i) => (
              <g key={`x-tick-${i}`}>
                <line 
                  x1={getX(tick)} 
                  y1={height - paddingBottom} 
                  x2={getX(tick)} 
                  y2={height - paddingBottom + 4} 
                  stroke="var(--color-ink-primary)" 
                  strokeWidth="2" 
                />
                <text 
                  x={getX(tick)} 
                  y={height - paddingBottom + 16} 
                  textAnchor="middle"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            ))}

            {/* Y-axis Ticks */}
            {yTicks.map((tick, i) => (
              <g key={`y-tick-${i}`}>
                <line 
                  x1={paddingLeft - 4} 
                  y1={getY(tick)} 
                  x2={paddingLeft} 
                  y2={getY(tick)} 
                  stroke="var(--color-ink-primary)" 
                  strokeWidth="2" 
                />
                <text 
                  x={paddingLeft - 10} 
                  y={getY(tick) + 3} 
                  textAnchor="end"
                >
                  {tick.toFixed(0)}
                </text>
              </g>
            ))}
          </g>

          {/* Axis Labels */}
          <text 
            x={width / 2 + 10} 
            y={height - 6} 
            textAnchor="middle" 
            className="font-heading text-xs font-bold" 
            fill="var(--color-ink-primary)"
          >
            {col1Config ? `${col1Config.name} (${col1Config.unit})` : "Voltage (V)"}
          </text>
          
          <text 
            x={12} 
            y={height / 2 - 10} 
            textAnchor="middle" 
            transform={`rotate(-90 12 ${height / 2 - 10})`}
            className="font-heading text-xs font-bold" 
            fill="var(--color-ink-primary)"
          >
            {col2Config ? `${col2Config.name} (${col2Config.unit})` : "Current (mA)"}
          </text>

          {/* Best Fit Line */}
          {showBestFit && data.length >= 2 && (
            <line
              x1={getX(0)}
              y1={getY(regression.intercept)}
              x2={getX(maxVoltage)}
              y2={getY(regression.slope * maxVoltage + regression.intercept)}
              stroke="var(--color-accent-orange)"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              className="drop-shadow-[1px_1px_1px_rgba(0,0,0,0.15)]"
            />
          )}

          {/* Data Points */}
          <g>
            {data.map((point) => {
              const cx = getX(point.voltage);
              const cy = getY(point.current);
              
              // Skip drawing if outside chart boundaries
              if (cx < paddingLeft || cx > width - paddingRight || cy < paddingTop || cy > height - paddingBottom) {
                return null;
              }

              return (
                <g key={point.sNo} className="cursor-pointer group/point">
                  {/* Point Ring Glow */}
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r="9" 
                    fill="var(--color-accent-blue)" 
                    fillOpacity="0"
                    className="hover:fill-opacity-15 transition-all duration-200"
                  />
                  {/* Outer circle - hand sketched effect */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="4.5"
                    fill="var(--color-accent-blue)"
                    stroke="var(--color-ink-primary)"
                    strokeWidth="1.5"
                    className="drop-shadow-[1px_1px_1px_rgba(0,0,0,0.2)]"
                  />
                  {/* Center dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="1.5"
                    fill="white"
                  />
                  
                  {/* Tooltip bubble inside graph */}
                  <title>
                    {`S.No: ${point.sNo}\n${col1Config?.name || 'Voltage'}: ${point.voltage} ${col1Config?.unit || 'V'}\n${col2Config?.name || 'Current'}: ${point.current} ${col2Config?.unit || 'mA'}`}
                  </title>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
