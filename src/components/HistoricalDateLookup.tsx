import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRight, History, Check } from 'lucide-react';
import { fetchRateOnSpecificDate } from '../services/currencyApi';
import { CURRENCY_MAP } from '../data/currencies';

interface HistoricalDateLookupProps {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  currentRate: number;
}

export const HistoricalDateLookup: React.FC<HistoricalDateLookupProps> = ({
  fromCurrency,
  toCurrency,
  amount,
  currentRate
}) => {
  // Default date: exactly 1 year ago
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 1);
  const [selectedDate, setSelectedDate] = useState<string>(
    defaultDate.toISOString().split('T')[0]
  );

  const [historicalRate, setHistoricalRate] = useState<number | null>(null);
  const [sourceInfo, setSourceInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fromInfo = CURRENCY_MAP[fromCurrency] || { symbol: '$', decimals: 2 };
  const toInfo = CURRENCY_MAP[toCurrency] || { symbol: '€', decimals: 2 };

  // Famous historical benchmark dates
  const presets = [
    { label: '1 Year Ago', date: (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split('T')[0]; })() },
    { label: '3 Years Ago', date: (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 3); return d.toISOString().split('T')[0]; })() },
    { label: '5 Years Ago', date: (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 5); return d.toISOString().split('T')[0]; })() },
    { label: 'Euro Parity (Jul 2022)', date: '2022-07-13' },
    { label: 'Pandemic Onset (Mar 2020)', date: '2020-03-23' },
    { label: 'Pre-Brexit (Jun 2016)', date: '2016-06-22' }
  ];

  useEffect(() => {
    let isMounted = true;
    async function loadDateRate() {
      setIsLoading(true);
      try {
        const res = await fetchRateOnSpecificDate(selectedDate, fromCurrency, toCurrency);
        if (isMounted) {
          setHistoricalRate(res.rate);
          setSourceInfo(res.source);
        }
      } catch (err) {
        console.error('Error fetching date rate:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadDateRate();
    return () => {
      isMounted = false;
    };
  }, [selectedDate, fromCurrency, toCurrency]);

  const pastConverted = historicalRate ? amount * historicalRate : 0;
  const currentConverted = amount * currentRate;
  const diffInTarget = currentConverted - pastConverted;
  const diffPercent = historicalRate ? ((currentRate - historicalRate) / historicalRate) * 100 : 0;

  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Historical Date Rate Lookup
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Look up the exact exchange rate on any single calendar day in financial history.
        </p>
      </div>

      {/* Date Picker & Presets */}
      <div className="my-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Select Calendar Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                min="2000-01-01"
                max={maxDate}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 text-white font-mono text-sm rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex-1">
            <span className="block text-xs font-medium text-slate-400 mb-1">
              Active Currency Pair
            </span>
            <div className="py-2 px-3 bg-slate-900 rounded-lg border border-slate-800 text-sm font-mono text-white flex items-center justify-between">
              <span>{fromCurrency} → {toCurrency}</span>
              <span className="text-xs text-slate-400">Amount: {amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-xs text-slate-400 font-medium">Historical Key Dates:</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setSelectedDate(p.date)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                  selectedDate === p.date
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-medium'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Result */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-6">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Fetching historical closing rate for {selectedDate}...
          </div>
        ) : historicalRate ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
              {/* Past Date Card */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-sans block">On {selectedDate}</span>
                <div className="text-2xl font-bold text-white mt-1 tabular-nums">
                  1 {fromCurrency} = {historicalRate.toFixed(4)} {toCurrency}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {amount.toLocaleString()} {fromCurrency} ={' '}
                  <span className="text-white font-semibold">
                    {toInfo.symbol}{pastConverted.toLocaleString('en-US', {
                      minimumFractionDigits: toInfo.decimals,
                      maximumFractionDigits: toInfo.decimals
                    })} {toCurrency}
                  </span>
                </div>
              </div>

              {/* Arrow / Shift */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-center">
                <span className="text-xs text-slate-400 font-sans block">Net Difference</span>
                <div className={`text-2xl font-bold mt-1 tabular-nums ${
                  diffPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(2)}%
                </div>
                <div className="text-xs text-slate-400 mt-2 tabular-nums">
                  {diffInTarget >= 0 ? '+' : ''}{toInfo.symbol}
                  {diffInTarget.toLocaleString('en-US', {
                    minimumFractionDigits: toInfo.decimals,
                    maximumFractionDigits: toInfo.decimals
                  })} {toCurrency}
                </div>
              </div>

              {/* Today's Rate Card */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-sans block">Today&apos;s Spot Rate</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
                  1 {fromCurrency} = {currentRate.toFixed(4)} {toCurrency}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {amount.toLocaleString()} {fromCurrency} ={' '}
                  <span className="text-white font-semibold">
                    {toInfo.symbol}{currentConverted.toLocaleString('en-US', {
                      minimumFractionDigits: toInfo.decimals,
                      maximumFractionDigits: toInfo.decimals
                    })} {toCurrency}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 pt-3 border-t border-slate-800 flex justify-between items-center">
              <span>Benchmark source: {sourceInfo}</span>
              <span className="text-slate-400 font-mono">Date fixed: {selectedDate}</span>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No rate data available for the chosen date.
          </div>
        )}
      </div>
    </div>
  );
};
