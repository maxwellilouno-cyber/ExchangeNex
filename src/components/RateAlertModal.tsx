import React, { useState } from 'react';
import { X, Bell, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { RateAlert } from '../types/currency';
import { CURRENCIES, CURRENCY_MAP } from '../data/currencies';

interface RateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: RateAlert[];
  onAddAlert: (alert: Omit<RateAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  onDeleteAlert: (id: string) => void;
  currentRates: Record<string, number>;
  baseCurrency: string;
}

export const RateAlertModal: React.FC<RateAlertModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onAddAlert,
  onDeleteAlert,
  currentRates,
  baseCurrency
}) => {
  const [fromCode, setFromCode] = useState('EUR');
  const [toCode, setToCode] = useState('USD');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetRate, setTargetRate] = useState<string>('1.1000');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(targetRate);
    if (isNaN(rateNum) || rateNum <= 0) return;

    onAddAlert({
      fromCurrency: fromCode,
      toCurrency: toCode,
      targetRate: rateNum,
      condition,
      notes: note.trim() || undefined
    });

    setNote('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">Rate Alerts &amp; Targets</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* New Alert Form */}
          <form onSubmit={handleSubmit} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Create New Rate Alert
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">From Currency</label>
                <select
                  value={fromCode}
                  onChange={(e) => setFromCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">To Currency</label>
                <select
                  value={toCode}
                  onChange={(e) => setToCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Trigger Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as 'ABOVE' | 'BELOW')}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="ABOVE">Rises Above (&gt;=)</option>
                  <option value="BELOW">Falls Below (&lt;=)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  value={targetRate}
                  onChange={(e) => setTargetRate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 1.1000"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Optional Note / Strategy</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Repatriate Q3 invoice profits"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save Rate Alert</span>
            </button>
          </form>

          {/* Active Alerts List */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Active &amp; Triggered Alerts ({alerts.length})
            </h4>

            {alerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                No alerts configured yet. Set one above to track target levels.
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => {
                  const fromFlag = CURRENCY_MAP[alert.fromCurrency]?.flag || '';
                  const toFlag = CURRENCY_MAP[alert.toCurrency]?.flag || '';

                  // Compute current rate for this pair
                  const fromVsBase = currentRates[alert.fromCurrency] || 1;
                  const toVsBase = currentRates[alert.toCurrency] || 1;
                  const currentPairRate = toVsBase / fromVsBase;

                  const isTriggered =
                    alert.condition === 'ABOVE'
                      ? currentPairRate >= alert.targetRate
                      : currentPairRate <= alert.targetRate;

                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        isTriggered
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{fromFlag}</span>
                          <span className="font-mono font-bold text-white text-xs">
                            {alert.fromCurrency}/{alert.toCurrency}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {alert.condition === 'ABOVE' ? '≥' : '≤'}
                          </span>
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            {alert.targetRate.toFixed(4)}
                          </span>

                          {isTriggered ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Triggered!
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                          <span>Current: {currentPairRate.toFixed(4)}</span>
                          <span>·</span>
                          <span>
                            Diff: {((currentPairRate - alert.targetRate) / alert.targetRate * 100).toFixed(2)}%
                          </span>
                          {alert.notes && (
                            <>
                              <span>·</span>
                              <span className="font-sans italic text-slate-500 truncate max-w-[150px]">
                                {alert.notes}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteAlert(alert.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors shrink-0 cursor-pointer"
                        title="Delete alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-500 flex justify-between items-center">
          <span>Alerts persist locally in your browser storage</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
