import { useMemo } from 'react';

interface GraphCanvasProps {
  data: { sNo: number; voltage: number; current: number }[];
  showGrid: boolean;
  showBestFit: boolean;
  zoomLevel: number;
  col1Config?: { name: string; unit: string };
  col2Config?: { name: string; unit: string };
  xTransform?: string;
  yTransform?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  // Backend-provided axis bounds (preferred when available)
  graphResult?: {
    xAxisMin?: number;
    xAxisMax?: number;
    yAxisMin?: number;
    yAxisMax?: number;
    slope?: number;
    intercept?: number;
  } | null;
}

function applyTransform(value: number, transform?: string): number {
  if (!transform) return value;
  switch (transform) {
    case 'square': return value * value;
    case 'log': return value > 0 ? Math.log10(value) : 0;
    default: return value;
  }
}

export const GraphCanvas = ({
  data,
  showGrid,
  showBestFit,
  zoomLevel: _zoomLevel,
  col1Config,
  col2Config,
  xTransform = 'none',
  yTransform = 'none',
  xAxisLabel,
  yAxisLabel,
  graphResult,
}: GraphCanvasProps) => {
  // SVG size parameters
  const width = 500;
  const height = 350;
  const paddingLeft = 50;
  const paddingBottom = 45;
  const paddingTop = 25;
  const paddingRight = 25;

  // Apply transformations
  const transformedData = useMemo(() => {
    return data.map(d => ({
      sNo: d.sNo,
      voltage: applyTransform(d.voltage, xTransform),
      current: applyTransform(d.current, yTransform),
      rawVoltage: d.voltage,
      rawCurrent: d.current,
    }));
  }, [data, xTransform, yTransform]);

  // Compute axis ranges from data with proper padding — NO hardcoded floors
  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    // If backend provided bounds, prefer those
    if (graphResult?.xAxisMax !== undefined && graphResult?.yAxisMax !== undefined) {
      return {
        xMin: graphResult.xAxisMin ?? 0,
        xMax: graphResult.xAxisMax,
        yMin: graphResult.yAxisMin ?? 0,
        yMax: graphResult.yAxisMax,
      };
    }

    // Otherwise compute from transformed data
    const xVals = transformedData.map(d => d.voltage);
    const yVals = transformedData.map(d => d.current);

    if (xVals.length === 0) return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };

    const xDataMin = Math.min(...xVals);
    const xDataMax = Math.max(...xVals);
    const yDataMin = Math.min(...yVals);
    const yDataMax = Math.max(...yVals);
    const xRange = xDataMax - xDataMin || 1;
    const yRange = yDataMax - yDataMin || 1;

    return {
      xMin: Math.min(xDataMin - xRange * 0.1, 0),
      xMax: xDataMax + xRange * 0.15,
      yMin: Math.min(yDataMin - yRange * 0.1, 0),
      yMax: yDataMax + yRange * 0.15,
    };
  }, [transformedData, graphResult]);

  // Linear Regression (y = mx + c) on transformed values
  const regression = useMemo(() => {
    // Prefer backend values if available
    if (graphResult?.slope !== undefined && graphResult?.intercept !== undefined) {
      return { slope: graphResult.slope, intercept: graphResult.intercept };
    }

    const n = transformedData.length;
    if (n < 2) return { slope: 0, intercept: 0 };
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    
    transformedData.forEach(d => {
      sumX += d.voltage;
      sumY += d.current;
      sumXY += d.voltage * d.current;
      sumXX += d.voltage * d.voltage;
    });
    
    const slopeNum = (n * sumXY) - (sumX * sumY);
    const slopeDen = (n * sumXX) - (sumX * sumX);
    const slope = slopeDen !== 0 ? slopeNum / slopeDen : 0;
    const intercept = (sumY - (slope * sumX)) / n;
    
    return { slope, intercept };
  }, [transformedData, graphResult]);

  // Coordinate Conversion Functions using computed ranges
  const getX = (voltage: number) => {
    const range = xMax - xMin || 1;
    const scale = (width - paddingLeft - paddingRight) / range;
    return paddingLeft + (voltage - xMin) * scale;
  };

  const getY = (current: number) => {
    const range = yMax - yMin || 1;
    const scale = (height - paddingTop - paddingBottom) / range;
    return height - paddingBottom - (current - yMin) * scale;
  };

  // Generate grid ticks with nice round numbers
  const xTicks = useMemo(() => {
    const steps = 6;
    return Array.from({ length: steps }).map((_, i) => xMin + ((xMax - xMin) / (steps - 1)) * i);
  }, [xMin, xMax]);

  const yTicks = useMemo(() => {
    const steps = 6;
    return Array.from({ length: steps }).map((_, i) => yMin + ((yMax - yMin) / (steps - 1)) * i);
  }, [yMin, yMax]);

  // Determine appropriate decimal places for tick labels
  const xDecimalPlaces = useMemo(() => {
    const range = xMax - xMin;
    if (range > 100) return 0;
    if (range > 10) return 1;
    if (range > 1) return 2;
    return 3;
  }, [xMin, xMax]);

  const yDecimalPlaces = useMemo(() => {
    const range = yMax - yMin;
    if (range > 100) return 0;
    if (range > 10) return 1;
    if (range > 1) return 2;
    return 3;
  }, [yMin, yMax]);

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
                  {tick.toFixed(xDecimalPlaces)}
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
                  {tick.toFixed(yDecimalPlaces)}
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
            {xAxisLabel || (col1Config ? `${col1Config.name} (${col1Config.unit})` : "Voltage (V)")}
          </text>
          
          <text 
            x={12} 
            y={height / 2 - 10} 
            textAnchor="middle" 
            transform={`rotate(-90 12 ${height / 2 - 10})`}
            className="font-heading text-xs font-bold" 
            fill="var(--color-ink-primary)"
          >
            {yAxisLabel || (col2Config ? `${col2Config.name} (${col2Config.unit})` : "Current (mA)")}
          </text>

          {/* Best Fit Line */}
          {showBestFit && transformedData.length >= 2 && (
            (() => {
              // Compute line endpoints clipped to the visible axis range
              const lineX1 = xMin;
              const lineY1 = regression.slope * lineX1 + regression.intercept;
              const lineX2 = xMax;
              const lineY2 = regression.slope * lineX2 + regression.intercept;
              return (
                <line
                  x1={getX(lineX1)}
                  y1={getY(lineY1)}
                  x2={getX(lineX2)}
                  y2={getY(lineY2)}
                  stroke="var(--color-accent-orange)"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  className="drop-shadow-[1px_1px_1px_rgba(0,0,0,0.15)]"
                />
              );
            })()
          )}

          {/* Data Points */}
          <g>
            {transformedData.map((point) => {
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
                    {`S.No: ${point.sNo}\n${col1Config?.name || 'X'}: ${point.rawVoltage} ${col1Config?.unit || ''}\n${col2Config?.name || 'Y'}: ${point.rawCurrent} ${col2Config?.unit || ''}${xTransform !== 'none' || yTransform !== 'none' ? `\nPlotted: (${point.voltage.toFixed(2)}, ${point.current.toFixed(2)})` : ''}`}
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

