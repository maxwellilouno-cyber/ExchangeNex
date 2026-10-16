import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';
import { CURRENCIES, POPULAR_CURRENCY_CODES } from '../data/currencies';
import { CurrencyInfo } from '../types/currency';

interface CurrencySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (currencyCode: string) => void;
  selectedCode: string;
  rates?: Record<string, number>;
  baseCode?: string;
  title?: string;
}

export const CurrencySelectorModal: React.FC<CurrencySelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedCode,
  rates = {},
  baseCode = 'USD',
  title = 'Select Currency'
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredCurrencies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [query]);

  const popularCurrencies = useMemo(() => {
    return CURRENCIES.filter((c) => POPULAR_CURRENCY_CODES.includes(c.code));
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by currency code, name, or country..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-950 text-slate-100 placeholder-slate-500 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Picks when query is empty */}
          {!query && (
            <div className="mt-3">
              <span className="text-xs text-slate-400 font-medium">Popular Currencies:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {popularCurrencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      onSelect(c.code);
                      onClose();
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                      selectedCode === c.code
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-semibold'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span className="font-mono">{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Currency List */}
        <div className="overflow-y-auto divide-y divide-slate-800/60 p-2">
          {filteredCurrencies.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No currencies found matching &quot;{query}&quot;
            </div>
          ) : (
            filteredCurrencies.map((currency: CurrencyInfo) => {
              const isSelected = currency.code === selectedCode;
              const rate = rates[currency.code];

              return (
                <button
                  key={currency.code}
                  onClick={() => {
                    onSelect(currency.code);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 text-white'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0 select-none">{currency.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-white tracking-wide text-sm">
                          {currency.code}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          {currency.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {currency.country}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4 text-right">
                    {rate !== undefined && baseCode !== currency.code && (
                      <div className="text-xs font-mono text-slate-400 tabular-nums">
                        1 {baseCode} = {rate < 1 ? rate.toFixed(4) : rate.toFixed(2)}
                      </div>
                    )}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-500 flex justify-between items-center">
          <span>{filteredCurrencies.length} currencies available</span>
          <span className="text-slate-400">Esc to close</span>
        </div>
      </div>
    </div>
  );
};
