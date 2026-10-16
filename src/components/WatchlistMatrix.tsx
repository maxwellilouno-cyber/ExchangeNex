import React, { useState } from 'react';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';
import { CURRENCIES, CURRENCY_MAP, DEFAULT_WATCHLIST } from '../data/currencies';
import { CurrencyInfo } from '../types/currency';

interface WatchlistMatrixProps {
  baseCurrency: string;
  amount: number;
  rates: Record<string, number>;
  onSelectPair: (from: string, to: string) => void;
  onOpenSelectorForWatchlist: () => void;
  watchlist: string[];
  onAddToWatchlist: (code: string) => void;
  onRemoveFromWatchlist: (code: string) => void;
}

export const WatchlistMatrix: React.FC<WatchlistMatrixProps> = ({
  baseCurrency,
  amount,
  rates,
  onSelectPair,
  watchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Cross matrix currencies
  const matrixCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];

  // Synthetic 7-day mini sparkline points generator based on rate
  const generateSparklinePoints = (code: string, currentRate: number) => {
    // Generate 6 previous points using deterministic variation
    const pts = [];
    let r = currentRate;
    const seed = code.charCodeAt(0) + code.charCodeAt(1);
    const trend = ((seed % 10) - 4.8) * 0.003;

    for (let i = 6; i >= 0; i--) {
      const noise = Math.sin(i * 1.5 + seed) * 0.008 * currentRate;
      const ptRate = r - (i * trend * currentRate) + noise;
      pts.push(ptRate);
    }
    pts[pts.length - 1] = currentRate;

    // SVG coordinates
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 0.0001;
    const width = 70;
    const height = 24;

    const path = pts
      .map((val, idx) => {
        const x = (idx / (pts.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    const isUp = pts[pts.length - 1] >= pts[0];
    const changePct = pts[0] !== 0 ? ((pts[pts.length - 1] - pts[0]) / pts[0]) * 100 : 0;

    return { path, isUp, changePct };
  };

  const availableCurrenciesToAdd = CURRENCIES.filter(
    (c) => !watchlist.includes(c.code) && c.code !== baseCurrency
  );

  return (
    <div className="space-y-8">
      {/* Watchlist Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">Multi-Currency Watchlist</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live conversion of {amount.toLocaleString()} {baseCurrency} into multiple world currencies simultaneously
            </p>
          </div>

          {/* Add Currency to Watchlist Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Currency</span>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-64 max-h-72 bg-slate-950 border border-slate-700 rounded-lg shadow-xl overflow-y-auto z-20 p-1 divide-y divide-slate-800">
                {availableCurrenciesToAdd.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400">All currencies added</div>
                ) : (
                  availableCurrenciesToAdd.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        onAddToWatchlist(c.code);
                        setShowAddMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 rounded flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span className="font-mono font-semibold">{c.code}</span>
                        <span className="text-slate-400 truncate max-w-[110px]">{c.name}</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Watchlist Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3">Currency</th>
                <th className="py-3 px-3 text-right">Spot Rate (1 {baseCurrency})</th>
                <th className="py-3 px-3 text-right">Converted ({amount.toLocaleString()} {baseCurrency})</th>
                <th className="py-3 px-3 text-center">7D Trend</th>
                <th className="py-3 px-3 text-right">Change</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {watchlist.map((code) => {
                const info: CurrencyInfo = CURRENCY_MAP[code] || {
                  code,
                  name: code,
                  symbol: code,
                  flag: '🌐',
                  country: '',
                  decimals: 2
                };
                const rate = rates[code] || 1;
                const converted = amount * rate;
                const spark = generateSparklinePoints(code, rate);

                return (
                  <tr key={code} className="hover:bg-slate-800/40 transition-colors">
                    {/* Currency Name & Flag */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl select-none">{info.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm tracking-wide">{code}</span>
                            <span className="text-slate-400 font-sans text-xs hidden sm:inline">
                              {info.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-sans block sm:hidden">
                            {info.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Rate */}
                    <td className="py-3.5 px-3 text-right text-slate-300 font-medium tabular-nums">
                      {rate < 1 ? rate.toFixed(4) : rate.toFixed(3)}
                    </td>

                    {/* Converted Amount */}
                    <td className="py-3.5 px-3 text-right tabular-nums">
                      <span className="text-sm font-bold text-emerald-400">
                        {info.symbol} {converted.toLocaleString('en-US', {
                          minimumFractionDigits: info.decimals,
                          maximumFractionDigits: info.decimals
                        })}
                      </span>
                    </td>

                    {/* 7-day sparkline */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center justify-center">
                        <svg width="70" height="24" className="overflow-visible">
                          <path
                            d={spark.path}
                            fill="none"
                            stroke={spark.isUp ? '#10B981' : '#F43F5E'}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </td>

                    {/* Change % */}
                    <td className="py-3.5 px-3 text-right tabular-nums">
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                          spark.isUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {spark.isUp ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        {spark.isUp ? '+' : ''}{spark.changePct.toFixed(2)}%
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectPair(baseCurrency, code)}
                          className="px-2.5 py-1 text-[11px] font-sans font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                        >
                          Chart
                        </button>
                        <button
                          onClick={() => onRemoveFromWatchlist(code)}
                          title="Remove from watchlist"
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Cross-Rate Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="pb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white tracking-tight">
            Interbank FX Cross-Rate Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time cross rates among world G7 reserve currencies. Read across: 1 Row Currency = Column Value.
          </p>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3 text-left font-sans text-slate-500">BASE \ QUOTE</th>
                {matrixCurrencies.map((col) => (
                  <th key={col} className="py-2.5 px-3 font-bold text-slate-300">
                    <div className="flex items-center justify-center gap-1">
                      <span>{CURRENCY_MAP[col]?.flag}</span>
                      <span>{col}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {matrixCurrencies.map((row) => {
                const rowRateVsBase = rates[row] || 1;

                return (
                  <tr key={row} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-left font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{CURRENCY_MAP[row]?.flag}</span>
                        <span>{row}</span>
                      </div>
                    </td>

                    {matrixCurrencies.map((col) => {
                      if (row === col) {
                        return (
                          <td key={col} className="py-3 px-3 text-slate-600 bg-slate-950/40">
                            1.0000
                          </td>
                        );
                      }

                      const colRateVsBase = rates[col] || 1;
                      const crossRate = colRateVsBase / rowRateVsBase;

                      return (
                        <td
                          key={col}
                          onClick={() => onSelectPair(row, col)}
                          title={`Click to chart ${row}/${col}`}
                          className="py-3 px-3 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 cursor-pointer tabular-nums transition-colors"
                        >
                          {crossRate < 1 ? crossRate.toFixed(4) : crossRate.toFixed(3)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
