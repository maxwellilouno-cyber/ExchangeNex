import React, { useState } from 'react';
import { DollarSign, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { CURRENCY_MAP } from '../data/currencies';
import { FeeComparisonTier } from '../types/currency';

interface FeeCalculatorProps {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  exchangeRate: number;
  onAmountChange: (amt: number) => void;
}

export const FeeCalculator: React.FC<FeeCalculatorProps> = ({
  fromCurrency,
  toCurrency,
  amount,
  exchangeRate,
  onAmountChange
}) => {
  const fromInfo = CURRENCY_MAP[fromCurrency] || { symbol: '$', decimals: 2 };
  const toInfo = CURRENCY_MAP[toCurrency] || { symbol: '€', decimals: 2 };

  // Common international transfer provider archetypes
  const tiers: FeeComparisonTier[] = [
    {
      provider: 'Interbank Benchmark (Mid-Market Rate)',
      type: 'midmarket',
      feePercentage: 0.0,
      fixedFee: 0,
      estimatedDelivery: 'Benchmark Rate'
    },
    {
      provider: 'Digital Fintech (Wise / Revolut style)',
      type: 'fintech',
      feePercentage: 0.45,
      fixedFee: 1.5,
      estimatedDelivery: 'Minutes to 1 day'
    },
    {
      provider: 'Credit / Debit Card (Standard foreign tx fee)',
      type: 'card',
      feePercentage: 3.0,
      fixedFee: 0,
      estimatedDelivery: 'Instant'
    },
    {
      provider: 'Traditional Bank (High street wire transfer)',
      type: 'bank',
      feePercentage: 3.4,
      fixedFee: 25.0,
      estimatedDelivery: '2 - 5 business days'
    },
    {
      provider: 'Airport Currency Exchange Kiosk',
      type: 'kiosk',
      feePercentage: 8.5,
      fixedFee: 4.0,
      estimatedDelivery: 'Cash on counter'
    }
  ];

  // Calculation for a tier
  const calculateTier = (tier: FeeComparisonTier) => {
    // Hidden markup reduces the effective exchange rate
    const markupRate = exchangeRate * (1 - tier.feePercentage / 100);
    // Amount remaining after fixed upfront fee
    const effectiveAmount = Math.max(0, amount - tier.fixedFee);
    const recipientGets = effectiveAmount * markupRate;

    // Ideal mid-market amount
    const idealRecipientGets = amount * exchangeRate;
    // Total loss in target currency
    const totalLossInTarget = Math.max(0, idealRecipientGets - recipientGets);
    // Total loss converted back to source currency
    const totalLossInSource = exchangeRate > 0 ? totalLossInTarget / exchangeRate : 0;

    return {
      recipientGets,
      totalLossInTarget,
      totalLossInSource,
      effectiveRate: markupRate
    };
  };

  const benchmarkResult = calculateTier(tiers[0]);
  const bankResult = calculateTier(tiers[3]);
  const savingsVsBank = Math.max(0, benchmarkResult.recipientGets - bankResult.recipientGets);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Foreign Exchange Fee &amp; Hidden Spread Analyzer
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Compare the real costs: banks often advertise &quot;zero commission&quot; while adding a 3% to 8% markup into their exchange rate.
        </p>
      </div>

      {/* Amount & Pair Controller */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Transfer Amount ({fromCurrency})</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
              {fromInfo.symbol}
            </span>
            <input
              type="number"
              min="1"
              value={amount === 0 ? '' : amount}
              onChange={(e) => onAmountChange(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-full pl-8 pr-4 py-2 bg-slate-900 text-white font-mono font-bold text-base rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Exchange Corridor</label>
          <div className="flex items-center gap-2 py-2 px-3 bg-slate-900 rounded-lg border border-slate-800 text-sm font-mono text-slate-200">
            <span>{fromCurrency}</span>
            <span className="text-slate-500">→</span>
            <span>{toCurrency}</span>
            <span className="ml-auto text-xs text-emerald-400 tabular-nums">
              Spot: {exchangeRate.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Savings Highlight Box */}
      {savingsVsBank > 0 && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-emerald-400 block text-sm">
              Potential Savings: {toInfo.symbol}
              {savingsVsBank.toLocaleString('en-US', {
                minimumFractionDigits: toInfo.decimals,
                maximumFractionDigits: toInfo.decimals
              })}{' '}
              {toCurrency}
            </span>
            <p className="text-slate-300 mt-0.5">
              By using mid-market interbank exchange rates instead of a traditional commercial bank spread, your recipient receives significantly more money.
            </p>
          </div>
        </div>
      )}

      {/* Comparison Cards / Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
              <th className="py-3 px-3">Provider / Channel</th>
              <th className="py-3 px-3">Effective FX Rate</th>
              <th className="py-3 px-3 text-right">Fixed Fee</th>
              <th className="py-3 px-3 text-right">Recipient Receives</th>
              <th className="py-3 px-3 text-right">Total Hidden Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {tiers.map((tier) => {
              const res = calculateTier(tier);
              const isBest = tier.type === 'midmarket';

              return (
                <tr
                  key={tier.provider}
                  className={`transition-colors ${
                    isBest ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3.5 px-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-sans font-bold text-sm ${isBest ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {tier.provider}
                        </span>
                        {isBest && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            Zero Markup
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 font-sans text-[11px] block mt-0.5">
                        {tier.feePercentage > 0 ? `~${tier.feePercentage}% spread` : 'Interbank spot'} · {tier.estimatedDelivery}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-slate-300 tabular-nums">
                    1 {fromCurrency} = {res.effectiveRate.toFixed(4)} {toCurrency}
                  </td>

                  <td className="py-3.5 px-3 text-right text-slate-400 tabular-nums">
                    {tier.fixedFee > 0 ? `${fromInfo.symbol}${tier.fixedFee.toFixed(2)}` : '$0.00'}
                  </td>

                  <td className="py-3.5 px-3 text-right tabular-nums">
                    <span className={`text-sm font-bold ${isBest ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {toInfo.symbol}
                      {res.recipientGets.toLocaleString('en-US', {
                        minimumFractionDigits: toInfo.decimals,
                        maximumFractionDigits: toInfo.decimals
                      })}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right tabular-nums">
                    {isBest ? (
                      <span className="text-emerald-400 font-medium">$0.00 (0.0%)</span>
                    ) : (
                      <span className="text-rose-400 font-medium">
                        -{fromInfo.symbol}
                        {res.totalLossInSource.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
        <span>
          Figures represent industry averages sampled from leading banking institutions, card networks (Visa/Mastercard standard FX markup), and retail foreign exchange desks.
        </span>
      </div>
    </div>
  );
};
