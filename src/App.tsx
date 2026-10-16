import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ConverterCard } from './components/ConverterCard';
import { HistoricalChart } from './components/HistoricalChart';
import { WatchlistMatrix } from './components/WatchlistMatrix';
import { FeeCalculator } from './components/FeeCalculator';
import { HistoricalDateLookup } from './components/HistoricalDateLookup';
import { CurrencySelectorModal } from './components/CurrencySelectorModal';
import { RateAlertModal } from './components/RateAlertModal';
import { DownloadPackageModal } from './components/DownloadPackageModal';
import { ExchangeRatesData, RateAlert } from './types/currency';
import { fetchLatestRates } from './services/currencyApi';
import { DEFAULT_WATCHLIST, CURRENCY_MAP } from './data/currencies';
import { ArrowRightLeft, TrendingUp, ShieldCheck, Globe2, Sparkles, Download, Smartphone } from 'lucide-react';

const ALERTS_STORAGE_KEY = 'omnirate_rate_alerts_v1';
const WATCHLIST_STORAGE_KEY = 'omnirate_watchlist_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('converter');
  const [downloadOpen, setDownloadOpen] = useState<boolean>(false);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [amount, setAmount] = useState<number>(1000);

  const [ratesData, setRatesData] = useState<ExchangeRatesData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Currency Selector Modal state
  const [selectorOpen, setSelectorOpen] = useState<boolean>(false);
  const [selectorSide, setSelectorSide] = useState<'from' | 'to'>('from');

  // Rate alerts state
  const [alertsOpen, setAlertsOpen] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<RateAlert[]>(() => {
    try {
      const saved = localStorage.getItem(ALERTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    } catch {
      return DEFAULT_WATCHLIST;
    }
  });

  // Persist alerts
  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    } catch {
      // Ignore
    }
  }, [alerts]);

  // Persist watchlist
  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    } catch {
      // Ignore
    }
  }, [watchlist]);

  // Fetch exchange rates whenever fromCurrency changes
  const loadRates = useCallback(async (base: string, force = false) => {
    setIsRefreshing(true);
    try {
      const data = await fetchLatestRates(base);
      setRatesData(data);
    } catch (err) {
      console.error('Failed to load rates for base:', base, err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRates(fromCurrency);
  }, [fromCurrency, loadRates]);

  // Direct exchange rate for active pair
  const exchangeRate = ratesData?.rates[toCurrency] || (toCurrency === fromCurrency ? 1.0 : 1.0);

  // Swap currencies handler
  const handleSwapCurrencies = () => {
    const oldFrom = fromCurrency;
    const oldTo = toCurrency;
    setFromCurrency(oldTo);
    setToCurrency(oldFrom);
  };

  // Selector handlers
  const handleOpenSelector = (side: 'from' | 'to') => {
    setSelectorSide(side);
    setSelectorOpen(true);
  };

  const handleSelectCurrency = (code: string) => {
    if (selectorSide === 'from') {
      if (code === toCurrency) {
        // Swap if selecting the other side
        setToCurrency(fromCurrency);
      }
      setFromCurrency(code);
    } else {
      if (code === fromCurrency) {
        setFromCurrency(toCurrency);
      }
      setToCurrency(code);
    }
  };

  // Watchlist helpers
  const handleAddToWatchlist = (code: string) => {
    if (!watchlist.includes(code)) {
      setWatchlist([...watchlist, code]);
    }
  };

  const handleRemoveFromWatchlist = (code: string) => {
    setWatchlist(watchlist.filter((c) => c !== code));
  };

  // Alert helpers
  const handleAddAlert = (newAlert: Omit<RateAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const alert: RateAlert = {
      ...newAlert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      triggered: false
    };
    setAlerts([alert, ...alerts]);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  const formattedLastUpdated = ratesData?.date ? ratesData.date : 'Today';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Top Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onRefresh={() => loadRates(fromCurrency, true)}
        isRefreshing={isRefreshing}
        lastUpdated={formattedLastUpdated}
        alertsCount={alerts.length}
        onOpenAlerts={() => setAlertsOpen(true)}
        onOpenDownload={() => setDownloadOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Download Callout Banner */}
        <div className="md:hidden mb-5 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Download className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs truncate">
              <span className="font-bold text-emerald-300 block">Download Project ZIP</span>
              <span className="text-slate-400 text-[11px]">Tap to download or install to phone</span>
            </div>
          </div>
          <button
            onClick={() => setDownloadOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shrink-0 cursor-pointer shadow-sm"
          >
            Download
          </button>
        </div>

        {/* Subtle Domain Subheader Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-900 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white tracking-wide">
              Global Foreign Exchange Workstation
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">
              Provider: {ratesData?.provider || 'Interbank Spot Quotes'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <button
              onClick={() => setDownloadOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Project Source (.ZIP)</span>
            </button>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ECB &amp; Market Fixing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <span>160+ Currencies Supported</span>
            </div>
          </div>
        </div>

        {/* Tab View Routing */}
        {activeTab === 'converter' && (
          <div className="space-y-8">
            <ConverterCard
              fromCurrency={fromCurrency}
              toCurrency={toCurrency}
              amount={amount}
              onAmountChange={setAmount}
              onSwapCurrencies={handleSwapCurrencies}
              onOpenSelector={handleOpenSelector}
              exchangeRate={exchangeRate}
              lastUpdated={formattedLastUpdated}
              onViewTrends={() => setActiveTab('trends')}
              onSetAlert={() => setAlertsOpen(true)}
              onViewFees={() => setActiveTab('fees')}
            />

            {/* Embedded Historical Chart Preview on Converter Page */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {fromCurrency}/{toCurrency} Historical Price Action
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('trends')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Full Analysis →
                </button>
              </div>

              <HistoricalChart
                fromCurrency={fromCurrency}
                toCurrency={toCurrency}
                currentRate={exchangeRate}
                onOpenSelector={handleOpenSelector}
              />
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <HistoricalChart
              fromCurrency={fromCurrency}
              toCurrency={toCurrency}
              currentRate={exchangeRate}
              onOpenSelector={handleOpenSelector}
            />

            {/* Secondary Comparison Pairs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Quick Historical Benchmark Pairs
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { from: 'EUR', to: 'USD' },
                  { from: 'GBP', to: 'USD' },
                  { from: 'USD', to: 'JPY' },
                  { from: 'USD', to: 'CAD' },
                  { from: 'AUD', to: 'USD' },
                  { from: 'USD', to: 'CHF' },
                  { from: 'USD', to: 'CNY' },
                  { from: 'EUR', to: 'GBP' }
                ].map((pair) => (
                  <button
                    key={`${pair.from}-${pair.to}`}
                    onClick={() => {
                      setFromCurrency(pair.from);
                      setToCurrency(pair.to);
                    }}
                    className={`p-3 text-left rounded-lg border transition-all cursor-pointer ${
                      fromCurrency === pair.from && toCurrency === pair.to
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
                      <span>{CURRENCY_MAP[pair.from]?.flag}</span>
                      <span>{pair.from}</span>
                      <span className="text-slate-500">/</span>
                      <span>{CURRENCY_MAP[pair.to]?.flag}</span>
                      <span>{pair.to}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Load Historical Chart
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'watchlist' && (
          <WatchlistMatrix
            baseCurrency={fromCurrency}
            amount={amount}
            rates={ratesData?.rates || {}}
            onSelectPair={(f, t) => {
              setFromCurrency(f);
              setToCurrency(t);
              setActiveTab('trends');
            }}
            onOpenSelectorForWatchlist={() => handleOpenSelector('from')}
            watchlist={watchlist}
            onAddToWatchlist={handleAddToWatchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
          />
        )}

        {activeTab === 'fees' && (
          <FeeCalculator
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            amount={amount}
            exchangeRate={exchangeRate}
            onAmountChange={setAmount}
          />
        )}

        {activeTab === 'historical_lookup' && (
          <HistoricalDateLookup
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            amount={amount}
            currentRate={exchangeRate}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">OmniRate FX</span>
            <span>·</span>
            <span>Foreign Exchange &amp; Interbank Rate Terminal</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Rates updated continuously</span>
            <span>·</span>
            <span>Zero Commercial Markup</span>
          </div>
        </div>
      </footer>

      {/* Currency Selector Modal */}
      <CurrencySelectorModal
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleSelectCurrency}
        selectedCode={selectorSide === 'from' ? fromCurrency : toCurrency}
        rates={ratesData?.rates || {}}
        baseCode={fromCurrency}
        title={selectorSide === 'from' ? 'Select Base Currency' : 'Select Target Currency'}
      />

      {/* Rate Alert Modal */}
      <RateAlertModal
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        alerts={alerts}
        onAddAlert={handleAddAlert}
        onDeleteAlert={handleDeleteAlert}
        currentRates={ratesData?.rates || {}}
        baseCurrency={fromCurrency}
      />

      {/* Download Package & Mobile Install Modal */}
      <DownloadPackageModal
        isOpen={downloadOpen}
        onClose={() => setDownloadOpen(false)}
      />
    </div>
  );
}
