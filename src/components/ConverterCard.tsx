import React, { useState } from 'react';
import { ArrowLeftRight, TrendingUp, Bell, Percent, Copy, Check } from 'lucide-react';
import { CURRENCY_MAP } from '../data/currencies';
import { CurrencyInfo } from '../types/currency';

interface ConverterCardProps {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  onAmountChange: (val: number) => void;
  onSwapCurrencies: () => void;
  onOpenSelector: (side: 'from' | 'to') => void;
  exchangeRate: number;
  lastUpdated: string;
  onViewTrends: () => void;
  onSetAlert: () => void;
  onViewFees: () => void;
}

export const ConverterCard: React.FC<ConverterCardProps> = ({
  fromCurrency,
  toCurrency,
  amount,
  onAmountChange,
  onSwapCurrencies,
  onOpenSelector,
  exchangeRate,
  lastUpdated,
  onViewTrends,
  onSetAlert,
  onViewFees
}) => {
  const [copied, setCopied] = useState(false);

  const fromInfo: CurrencyInfo = CURRENCY_MAP[fromCurrency] || {
    code: fromCurrency,
    name: fromCurrency,
    symbol: '$',
    flag: '🌐',
    country: '',
    decimals: 2
  };

  const toInfo: CurrencyInfo = CURRENCY_MAP[toCurrency] || {
    code: toCurrency,
    name: toCurrency,
    symbol: '€',
    flag: '🌐',
    country: '',
    decimals: 2
  };

  const convertedValue = amount * exchangeRate;
  const inverseRate = exchangeRate > 0 ? 1 / exchangeRate : 0;

  // Formatting helpers
  const formatCurrency = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(val);
  };

  const handleCopy = () => {
    const text = `${formatCurrency(amount, fromInfo.decimals)} ${fromCurrency} = ${formatCurrency(convertedValue, toInfo.decimals)} ${toCurrency}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickDenominations = [100, 500, 1000, 5000, 10000];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm">
      {/* Top Title & Inverse Rate Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Real-Time Currency Conversion</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mid-market interbank rate · Zero commission markup
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          <span>1 {fromCurrency} =</span>
          <span className="text-emerald-400 font-bold tabular-nums">
            {exchangeRate < 1 ? exchangeRate.toFixed(4) : exchangeRate.toFixed(3)} {toCurrency}
          </span>
        </div>
      </div>

      {/* Main Conversion Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-4 items-center my-6">
        {/* Source Currency Input */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">You Send</span>
            <button
              onClick={() => onOpenSelector('from')}
              className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-700 transition-colors cursor-pointer text-xs font-medium"
            >
              <span className="text-base select-none">{fromInfo.flag}</span>
              <span className="font-mono font-semibold">{fromInfo.code}</span>
              <span className="text-slate-400">▾</span>
            </button>
          </div>

          <div className="relative flex items-center">
            <span className="text-xl font-medium text-slate-500 mr-2 select-none">
              {fromInfo.symbol}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={amount === 0 ? '' : amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onAmountChange(isNaN(val) ? 0 : Math.max(0, val));
              }}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl sm:text-3xl font-bold font-mono text-white placeholder-slate-600 focus:outline-none tabular-nums"
            />
          </div>
          <div className="mt-1 text-xs text-slate-500 truncate">
            {fromInfo.name} ({fromInfo.country})
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 lg:my-0">
          <button
            onClick={onSwapCurrencies}
            title="Swap Currencies"
            className="p-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-full transition-transform hover:rotate-180 active:scale-95 cursor-pointer shadow-md"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
        </div>

        {/* Target Currency Display */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Recipient Gets</span>
            <button
              onClick={() => onOpenSelector('to')}
              className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-700 transition-colors cursor-pointer text-xs font-medium"
            >
              <span className="text-base select-none">{toInfo.flag}</span>
              <span className="font-mono font-semibold">{toInfo.code}</span>
              <span className="text-slate-400">▾</span>
            </button>
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <span className="text-xl font-medium text-slate-500 mr-2 select-none">
                {toInfo.symbol}
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 truncate tabular-nums">
                {formatCurrency(convertedValue, toInfo.decimals)}
              </div>
            </div>

            <button
              onClick={handleCopy}
              title="Copy result"
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors shrink-0 ml-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-1 text-xs text-slate-500 truncate">
            {toInfo.name} ({toInfo.country})
          </div>
        </div>
      </div>

      {/* Quick Denomination Chips */}
      <div className="flex items-center flex-wrap gap-2 pt-1 pb-4">
        <span className="text-xs text-slate-400 font-medium mr-1">Quick Add:</span>
        {quickDenominations.map((denom) => (
          <button
            key={denom}
            onClick={() => onAmountChange(amount + denom)}
            className="px-2.5 py-1 text-xs font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-md transition-colors cursor-pointer"
          >
            +{denom.toLocaleString()}
          </button>
        ))}
        <button
          onClick={() => onAmountChange(1000)}
          className="px-2.5 py-1 text-xs font-mono bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-md transition-colors cursor-pointer"
        >
          Reset $1,000
        </button>
      </div>

      {/* Primary Result Banner & Rate Context */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 my-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 font-medium">Interbank Market Calculation</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 tabular-nums">
              {formatCurrency(amount, fromInfo.decimals)} {fromCurrency} ={' '}
              <span className="text-emerald-400">
                {formatCurrency(convertedValue, toInfo.decimals)} {toCurrency}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2 font-mono tabular-nums">
              <span>1 {fromCurrency} = {exchangeRate < 1 ? exchangeRate.toFixed(4) : exchangeRate.toFixed(3)} {toCurrency}</span>
              <span className="text-slate-600">·</span>
              <span>1 {toCurrency} = {inverseRate < 1 ? inverseRate.toFixed(4) : inverseRate.toFixed(3)} {fromCurrency}</span>
            </div>
          </div>

          {/* Action Shortcuts */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <button
              onClick={onViewTrends}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Historical Trend</span>
            </button>
            <button
              onClick={onSetAlert}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Set Alert</span>
            </button>
            <button
              onClick={onViewFees}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Percent className="w-3.5 h-3.5 text-cyan-400" />
              <span>Transfer Fees</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Conversion Reference Tables (Side by Side) */}
      <div className="mt-6 pt-6 border-t border-slate-800">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Quick Denomination Reference Tables
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Table 1: From -> To */}
          <div className="bg-slate-950 rounded-lg border border-slate-800/80 p-3">
            <div className="text-slate-400 font-semibold mb-2 pb-1 border-b border-slate-800 flex justify-between">
              <span>Convert {fromCurrency}</span>
              <span>Into {toCurrency}</span>
            </div>
            <div className="space-y-1.5 tabular-nums">
              {[1, 5, 10, 25, 50, 100, 500, 1000].map((unit) => (
                <div key={unit} className="flex justify-between text-slate-300 hover:bg-slate-900/60 px-1 rounded">
                  <span>{unit.toLocaleString()} {fromCurrency}</span>
                  <span className="text-emerald-400 font-medium">
                    {formatCurrency(unit * exchangeRate, toInfo.decimals)} {toCurrency}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Table 2: To -> From */}
          <div className="bg-slate-950 rounded-lg border border-slate-800/80 p-3">
            <div className="text-slate-400 font-semibold mb-2 pb-1 border-b border-slate-800 flex justify-between">
              <span>Convert {toCurrency}</span>
              <span>Into {fromCurrency}</span>
            </div>
            <div className="space-y-1.5 tabular-nums">
              {[1, 5, 10, 25, 50, 100, 500, 1000].map((unit) => (
                <div key={unit} className="flex justify-between text-slate-300 hover:bg-slate-900/60 px-1 rounded">
                  <span>{unit.toLocaleString()} {toCurrency}</span>
                  <span className="text-slate-200 font-medium">
                    {formatCurrency(unit * inverseRate, fromInfo.decimals)} {fromCurrency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
