import React from 'react';
import { RefreshCw, Bell, ArrowRightLeft, Download } from 'lucide-react';

export type ActiveTab = 'converter' | 'trends' | 'watchlist' | 'fees' | 'historical_lookup';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
  alertsCount: number;
  onOpenAlerts: () => void;
  onOpenDownload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onRefresh,
  isRefreshing,
  lastUpdated,
  alertsCount,
  onOpenAlerts,
  onOpenDownload
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <span 
            onClick={() => onSelectTab('converter')}
            className="text-lg font-bold tracking-tight text-white cursor-pointer hover:text-emerald-400 transition-colors whitespace-nowrap"
          >
            OmniRate FX
          </span>
        </div>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <button
            onClick={() => onSelectTab('converter')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'converter'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            Converter
          </button>
          <button
            onClick={() => onSelectTab('trends')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'trends'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            Historical Trends
          </button>
          <button
            onClick={() => onSelectTab('watchlist')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'watchlist'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            Watchlist &amp; Matrix
          </button>
          <button
            onClick={() => onSelectTab('fees')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'fees'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            Transfer Fees
          </button>
          <button
            onClick={() => onSelectTab('historical_lookup')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'historical_lookup'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
          >
            Date Lookup
          </button>
        </nav>

        {/* Zone 3: Primary action & live market status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex flex-col text-right text-xs">
            <span className="text-slate-400">Interbank Spot Rates</span>
            <span className="font-mono text-slate-500 tabular-nums">
              {lastUpdated ? `Sync: ${lastUpdated}` : 'Live Synchronized'}
            </span>
          </div>

          <button
            onClick={onOpenDownload}
            title="Download App (.ZIP) or Install PWA"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Download ZIP</span>
            <span className="sm:hidden">Get App</span>
          </button>

          <button
            onClick={onOpenAlerts}
            title="Rate Alerts"
            className="relative p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {alertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center">
                {alertsCount}
              </span>
            )}
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-70 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Updating...' : 'Live Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation tab scrollbar + Quick Download action */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 border-t border-slate-900 bg-slate-950/95 overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          {(['converter', 'trends', 'watchlist', 'fees', 'historical_lookup'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                activeTab === tab
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'converter' && 'Converter'}
              {tab === 'trends' && 'Trends'}
              {tab === 'watchlist' && 'Watchlist'}
              {tab === 'fees' && 'Fees'}
              {tab === 'historical_lookup' && 'Date'}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenDownload}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md shrink-0 cursor-pointer ml-auto"
        >
          <Download className="w-3 h-3" />
          <span>ZIP</span>
        </button>
      </div>
    </header>
  );
};
