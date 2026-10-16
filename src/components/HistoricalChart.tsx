import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Download, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import { HistoricalRatePoint, TimeframeOption } from '../types/currency';
import { fetchHistoricalRates } from '../services/currencyApi';
import { CURRENCY_MAP } from '../data/currencies';

interface HistoricalChartProps {
  fromCurrency: string;
  toCurrency: string;
  currentRate: number;
  onOpenSelector?: (side: 'from' | 'to') => void;
}

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  fromCurrency,
  toCurrency,
  currentRate,
  onOpenSelector
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1M');
  const [dataPoints, setDataPoints] = useState<HistoricalRatePoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showSMA, setShowSMA] = useState<boolean>(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load historical data whenever pair or timeframe changes
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const points = await fetchHistoricalRates(fromCurrency, toCurrency, timeframe, currentRate);
        if (isMounted) {
          setDataPoints(points);
        }
      } catch (err) {
        console.error('Failed to load historical rates:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [fromCurrency, toCurrency, timeframe, currentRate]);

  // Compute key statistics
  const stats = useMemo(() => {
    if (!dataPoints || dataPoints.length === 0) {
      return {
        firstRate: currentRate,
        lastRate: currentRate,
        change: 0,
        changePercent: 0,
        minRate: currentRate,
        maxRate: currentRate,
        minDate: '',
        maxDate: '',
        avgRate: currentRate,
        volatilityPercent: 0
      };
    }

    const firstRate = dataPoints[0].rate;
    const lastRate = dataPoints[dataPoints.length - 1].rate;
    const change = lastRate - firstRate;
    const changePercent = (change / firstRate) * 100;

    let minRate = dataPoints[0].rate;
    let maxRate = dataPoints[0].rate;
    let minDate = dataPoints[0].date;
    let maxDate = dataPoints[0].date;
    let sum = 0;

    for (const p of dataPoints) {
      sum += p.rate;
      if (p.rate < minRate) {
        minRate = p.rate;
        minDate = p.date;
      }
      if (p.rate > maxRate) {
        maxRate = p.rate;
        maxDate = p.date;
      }
    }

    const avgRate = sum / dataPoints.length;
    const volatilityPercent = minRate > 0 ? ((maxRate - minRate) / minRate) * 100 : 0;

    return {
      firstRate,
      lastRate,
      change,
      changePercent,
      minRate,
      maxRate,
      minDate,
      maxDate,
      avgRate,
      volatilityPercent
    };
  }, [dataPoints, currentRate]);

  // Compute Simple Moving Average (SMA)
  const smaPoints = useMemo(() => {
    if (!showSMA || dataPoints.length < 5) return [];
    const windowSize = Math.max(3, Math.floor(dataPoints.length / 7));
    return dataPoints.map((point, idx) => {
      if (idx < windowSize - 1) {
        return null;
      }
      let sum = 0;
      for (let w = 0; w < windowSize; w++) {
        sum += dataPoints[idx - w].rate;
      }
      return sum / windowSize;
    });
  }, [dataPoints, showSMA]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!dataPoints.length) return;
    const csvRows = ['Date,Pair,Rate'];
    dataPoints.forEach((p) => {
      csvRows.push(`${p.date},${fromCurrency}/${toCurrency},${p.rate}`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fromCurrency}_${toCurrency}_${timeframe}_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Chart Dimensions & Calculations
  const chartHeight = 320;
  const chartWidth = 800; // viewBox coordinate space
  const padding = { top: 30, right: 20, bottom: 40, left: 20 };

  const usableWidth = chartWidth - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  const yMin = stats.minRate * 0.997;
  const yMax = stats.maxRate * 1.003;
  const yRange = yMax - yMin || 0.0001;

  const getCoordinates = (index: number, rate: number) => {
    const x = padding.left + (index / (Math.max(1, dataPoints.length - 1))) * usableWidth;
    const y = padding.top + usableHeight - ((rate - yMin) / yRange) * usableHeight;
    return { x, y };
  };

  // Build SVG path
  const { pathData, areaData, smaPathData } = useMemo(() => {
    if (dataPoints.length < 2) return { pathData: '', areaData: '', smaPathData: '' };

    const coords = dataPoints.map((p, i) => getCoordinates(i, p.rate));

    // Smooth spline
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const baselineY = chartHeight - padding.bottom;
    const area = `${path} L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`;

    // SMA path
    let smaPath = '';
    if (showSMA && smaPoints.length > 0) {
      let started = false;
      smaPoints.forEach((val, i) => {
        if (val !== null) {
          const coord = getCoordinates(i, val);
          if (!started) {
            smaPath += `M ${coord.x} ${coord.y}`;
            started = true;
          } else {
            smaPath += ` L ${coord.x} ${coord.y}`;
          }
        }
      });
    }

    return { pathData: path, areaData: area, smaPathData: smaPath };
  }, [dataPoints, smaPoints, showSMA, yMin, yRange]);

  // Mouse / Touch interaction for crosshair
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dataPoints.length) return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - svgRect.left;
    const relativeX = clientX / svgRect.width;
    const scaledX = relativeX * chartWidth;

    const dataX = Math.max(0, Math.min(usableWidth, scaledX - padding.left));
    const rawIndex = Math.round((dataX / usableWidth) * (dataPoints.length - 1));
    const safeIndex = Math.max(0, Math.min(dataPoints.length - 1, rawIndex));
    setHoverIndex(safeIndex);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const isPositive = stats.change >= 0;
  const activeHoverPoint = hoverIndex !== null && dataPoints[hoverIndex] ? dataPoints[hoverIndex] : null;
  const activeHoverCoords = hoverIndex !== null && activeHoverPoint ? getCoordinates(hoverIndex, activeHoverPoint.rate) : null;

  const fromInfo = CURRENCY_MAP[fromCurrency];
  const toInfo = CURRENCY_MAP[toCurrency];

  const avgCoords = padding.top + usableHeight - ((stats.avgRate - yMin) / yRange) * usableHeight;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      {/* Top Header & Timeframe Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-lg font-bold text-white">
              <span>{fromInfo?.flag}</span>
              <span>{fromCurrency}</span>
              <span className="text-slate-500 font-light">/</span>
              <span>{toInfo?.flag}</span>
              <span>{toCurrency}</span>
            </div>

            {onOpenSelector && (
              <button
                onClick={() => onOpenSelector('from')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-0.5 rounded border border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
              >
                Change Pair
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Exchange rate trend over the selected period · European Central Bank &amp; Interbank fixing
          </p>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          {(['7D', '1M', '3M', '6M', '1Y', '5Y'] as TimeframeOption[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                timeframe === tf
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-5 border-b border-slate-800/80">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Spot Rate</span>
          <span className="text-base font-bold font-mono text-white tabular-nums mt-0.5">
            {stats.lastRate < 1 ? stats.lastRate.toFixed(4) : stats.lastRate.toFixed(3)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">1 {fromCurrency} in {toCurrency}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">{timeframe} Net Change</span>
          <div className="flex items-center gap-1 mt-0.5">
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span
              className={`text-base font-bold font-mono tabular-nums ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {stats.changePercent.toFixed(2)}%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
            {isPositive ? '+' : ''}{stats.change.toFixed(4)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Period High</span>
          <span className="text-base font-semibold font-mono text-white tabular-nums mt-0.5">
            {stats.maxRate < 1 ? stats.maxRate.toFixed(4) : stats.maxRate.toFixed(3)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">{stats.maxDate || '—'}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Period Low</span>
          <span className="text-base font-semibold font-mono text-white tabular-nums mt-0.5">
            {stats.minRate < 1 ? stats.minRate.toFixed(4) : stats.minRate.toFixed(3)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">{stats.minDate || '—'}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Average Rate</span>
          <span className="text-base font-semibold font-mono text-white tabular-nums mt-0.5">
            {stats.avgRate < 1 ? stats.avgRate.toFixed(4) : stats.avgRate.toFixed(3)}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">Mean channel</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Range Spread</span>
          <span className="text-base font-semibold font-mono text-white tabular-nums mt-0.5">
            {stats.volatilityPercent.toFixed(2)}%
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">High vs Low swing</span>
        </div>
      </div>

      {/* Chart Toolbar: Moving Average & CSV */}
      <div className="flex items-center justify-between pt-4 pb-2 text-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSMA(!showSMA)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors cursor-pointer ${
              showSMA
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-medium'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Moving Average (SMA)</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-slate-400">
            <span className="inline-block w-2.5 h-0.5 bg-emerald-400"></span>
            <span>Interbank Close</span>
            {showSMA && (
              <>
                <span className="inline-block w-2.5 h-0.5 bg-amber-400 ml-2"></span>
                <span>Trend Smoother</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isLoading || dataPoints.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Interactive SVG Chart Viewport */}
      <div 
        ref={containerRef} 
        className="relative w-full h-[320px] select-none mt-2 bg-slate-950/40 rounded-lg p-2 border border-slate-800/60"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
            <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full mr-2"></div>
            Loading historical exchange series...
          </div>
        ) : dataPoints.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
            No historical data available for this pair in the chosen timeframe.
          </div>
        ) : (
          <svg
            className="w-full h-full overflow-visible cursor-crosshair"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isPositive ? '#10B981' : '#F43F5E'}
                  stopOpacity="0.28"
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? '#10B981' : '#F43F5E'}
                  stopOpacity="0.0"
                />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
              const y = padding.top + usableHeight * ratio;
              return (
                <line
                  key={ratio}
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#1E293B"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Average Reference Line */}
            {avgCoords >= padding.top && avgCoords <= chartHeight - padding.bottom && (
              <g>
                <line
                  x1={padding.left}
                  y1={avgCoords}
                  x2={chartWidth - padding.right}
                  y2={avgCoords}
                  stroke="#64748B"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.6"
                />
                <text
                  x={chartWidth - padding.right - 4}
                  y={avgCoords - 4}
                  textAnchor="end"
                  fill="#94A3B8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  AVG {stats.avgRate < 1 ? stats.avgRate.toFixed(4) : stats.avgRate.toFixed(3)}
                </text>
              </g>
            )}

            {/* Area Fill */}
            <path d={areaData} fill="url(#areaGradient)" />

            {/* Main Trend Line */}
            <path
              d={pathData}
              fill="none"
              stroke={isPositive ? '#10B981' : '#F43F5E'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Simple Moving Average Line */}
            {showSMA && smaPathData && (
              <path
                d={smaPathData}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray="3 3"
              />
            )}

            {/* Crosshair Cursor & Indicator Dot */}
            {activeHoverCoords && activeHoverPoint && (
              <g>
                {/* Vertical cursor line */}
                <line
                  x1={activeHoverCoords.x}
                  y1={padding.top}
                  x2={activeHoverCoords.x}
                  y2={chartHeight - padding.bottom}
                  stroke="#94A3B8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                {/* Outer halo */}
                <circle
                  cx={activeHoverCoords.x}
                  cy={activeHoverCoords.y}
                  r="6"
                  fill={isPositive ? '#10B981' : '#F43F5E'}
                  opacity="0.3"
                />
                {/* Solid center dot */}
                <circle
                  cx={activeHoverCoords.x}
                  cy={activeHoverCoords.y}
                  r="3.5"
                  fill="#FFFFFF"
                  stroke={isPositive ? '#10B981' : '#F43F5E'}
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Date axis ticks at bottom */}
            {dataPoints.length > 0 && (
              <g className="text-[10px] font-mono fill-slate-500">
                <text x={padding.left} y={chartHeight - 12} textAnchor="start">
                  {dataPoints[0].date}
                </text>
                <text x={chartWidth / 2} y={chartHeight - 12} textAnchor="middle">
                  {dataPoints[Math.floor(dataPoints.length / 2)].date}
                </text>
                <text x={chartWidth - padding.right} y={chartHeight - 12} textAnchor="end">
                  {dataPoints[dataPoints.length - 1].date}
                </text>
              </g>
            )}
          </svg>
        )}

        {/* Floating Tooltip Box */}
        {activeHoverCoords && activeHoverPoint && (
          <div
            className="absolute z-10 pointer-events-none bg-slate-900 border border-slate-700 shadow-xl rounded-lg p-2.5 text-xs text-white transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${(activeHoverCoords.x / chartWidth) * 100}%`,
              top: `${(activeHoverCoords.y / chartHeight) * 100}%`,
              maxWidth: '190px'
            }}
          >
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] border-b border-slate-800 pb-1 mb-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{activeHoverPoint.date}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400">Rate:</span>
              <span className="font-bold font-mono text-emerald-400 tabular-nums">
                {activeHoverPoint.rate < 1 ? activeHoverPoint.rate.toFixed(5) : activeHoverPoint.rate.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px] mt-0.5">
              <span className="text-slate-500">Vs Period Start:</span>
              <span
                className={`font-mono font-medium tabular-nums ${
                  activeHoverPoint.rate >= stats.firstRate ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {activeHoverPoint.rate >= stats.firstRate ? '+' : ''}
                {(((activeHoverPoint.rate - stats.firstRate) / stats.firstRate) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Historical Context Note */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>Historical quotes reflect interbank closing rates aggregated from global foreign exchange desks.</span>
        <span className="font-mono text-slate-400">{dataPoints.length} observation points</span>
      </div>
    </div>
  );
};
