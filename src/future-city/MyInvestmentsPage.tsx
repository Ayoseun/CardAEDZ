import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Clock, CheckCircle, Building2,
  AlertCircle, Gift, X,
} from 'lucide-react';
import type { Investment, Property } from './types';
import { MOCK_INVESTMENTS } from './data/mockProperties';
import PropertyDetailPage from './PropertyDetailPage';
import CheckoutPage from './CheckoutPage';

interface MyInvestmentsPageProps {
  fcvBalance: string;
  onSellTokens?: (investmentId: string, amount: number) => Promise<void>;
  onInvest: (propertyId: string, amount: number) => Promise<void>;
}

type View = 'list' | 'detail' | 'checkout';

function formatFCV(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M FCV`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K FCV`;
  return `${value} FCV`;
}

export default function MyInvestmentsPage({ fcvBalance, onSellTokens, onInvest }: MyInvestmentsPageProps) {
  const [view, setView] = useState<View>('list');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [checkoutTokens, setCheckoutTokens] = useState(1);
  const [sellModal, setSellModal] = useState<Investment | null>(null);
  const [sellAmount, setSellAmount] = useState('');
  const [isSelling, setIsSelling] = useState(false);

  const investments = MOCK_INVESTMENTS;

  const totalInvested = investments.reduce((sum: any, inv: any) => sum + inv.investedAmount, 0);
  const totalCurrentValue = investments.reduce((sum: any, inv: any) => sum + inv.currentValue, 0);
  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalRewards = investments.reduce((sum: any, inv: any) => sum + inv.rewardEarned, 0);

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckout = (property: Property, tokens: number) => {
    setSelectedProperty(property);
    setCheckoutTokens(tokens);
    setView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSell = async () => {
    if (!sellModal || !sellAmount || parseFloat(sellAmount) <= 0) return;
    setIsSelling(true);
    try {
      await onSellTokens?.(sellModal.id, parseFloat(sellAmount));
      setSellModal(null);
      setSellAmount('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSelling(false);
    }
  };

  // ── Sub-page: Property Detail ──────────────────────────────────────────────
  if (view === 'detail' && selectedProperty) {
    return (
      <div className="-mx-4 md:-mx-8 -mb-8">
        <PropertyDetailPage
         //@ts-ignore
          property={selectedProperty}
          fcvBalance={fcvBalance}
          onBack={() => setView('list')}
          onCheckout={handleCheckout}
        />
      </div>
    );
  }

  // ── Sub-page: Checkout ─────────────────────────────────────────────────────
  if (view === 'checkout' && selectedProperty) {
    return (
      <div className="-mx-4 md:-mx-8 -mb-8">
        <CheckoutPage
          property={selectedProperty}
          initialTokens={checkoutTokens}
          fcvBalance={fcvBalance}
          onBack={() => setView('detail')}
          onConfirm={onInvest}
          onSuccess={() => setView('list')}
        />
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (investments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-16 text-center border border-gray-100">
        <Building2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Investments Yet</h3>
        <p className="text-gray-400 text-sm">Start investing in properties to build your portfolio.</p>
      </div>
    );
  }

  // ── Main list ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Portfolio summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invested',  value: totalInvested.toLocaleString(),                                      suffix: ' FCV',  color: 'text-gray-900'   },
          { label: 'Current Value',   value: totalCurrentValue.toLocaleString(),                                   suffix: ' FCV',  color: 'text-indigo-600' },
          { label: 'Total Gain/Loss', value: `${totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()}`, suffix: ' FCV',  color: totalGainLoss >= 0 ? 'text-green-600' : 'text-red-500' },
          { label: 'Rewards Earned',  value: totalRewards.toLocaleString(),                                        suffix: ' FCC',  color: 'text-purple-600' },
        ].map(({ label, value, suffix, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>
              {value}<span className="text-xs font-medium text-gray-400">{suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Investments list */}
      <div className="space-y-4">
        {investments.map((inv: any) => {
          const isPreCooloff = inv.status === 'pre_cooloff';
          const gainColor = inv.gainLoss >= 0 ? 'text-green-600' : 'text-red-500';
          const daysLeft = inv.cooloffDeadline
            ? Math.max(0, Math.ceil((new Date(inv.cooloffDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : 0;

          return (
            <div key={inv.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">

              {/* Cool-off banner */}
              {isPreCooloff && (
                <div className="bg-amber-50 border-b border-amber-100 px-5 py-2.5 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    Cool-off period active — {daysLeft} days remaining. You can withdraw your investment before it ends.
                  </p>
                </div>
              )}

              <div className="p-5">
                <div className="flex gap-4">
                  {/* Property thumbnail */}
                  <div
                    className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 cursor-pointer"
                    onClick={() => handleViewProperty(inv.property)}
                  >
                    <img
                  //@ts-ignore
                      src={inv.property.imageUrl}
                      alt={inv.property.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className="font-bold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors text-sm leading-snug"
                          onClick={() => handleViewProperty(inv.property)}
                        >
                          {inv.property.name}
                        </h3>
                        <p className="text-gray-400 text-xs mt-0.5">{inv.property.location}</p>
                      </div>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                        isPreCooloff ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isPreCooloff ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {isPreCooloff ? 'Cool-off' : 'Active'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-gray-400">Tokens Owned</p>
                        <p className="text-sm font-bold text-gray-800">{inv.tokensOwned}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Invested</p>
                        <p className="text-sm font-bold text-gray-800">{formatFCV(inv.investedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Current Value</p>
                        <p className="text-sm font-bold text-indigo-600">{formatFCV(inv.currentValue)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        {inv.gainLoss >= 0
                          ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                          : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                        <span className={`text-sm font-semibold ${gainColor}`}>
                          {inv.gainLoss >= 0 ? '+' : ''}{formatFCV(inv.gainLoss)} ({inv.gainLossPercent}%)
                        </span>
                      </div>
                      {inv.rewardEarned > 0 && (
                        <div className="flex items-center gap-1 text-purple-600 text-xs">
                          <Gift className="w-3.5 h-3.5" />
                          <span className="font-semibold">{inv.rewardEarned} FCC earned</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleViewProperty(inv.property)}
                    className="flex-1 py-2 border border-indigo-200 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors"
                  >
                    View Property
                  </button>

                  {!isPreCooloff && onSellTokens && (
                    <button
                      onClick={() => { setSellModal(inv); setSellAmount(''); }}
                      className="flex-1 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-700 transition-all"
                    >
                      Sell Tokens
                    </button>
                  )}

                  {isPreCooloff && (
                    <button className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
                      Withdraw (Cool-off)
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sell Modal ─────────────────────────────────────────────────────── */}
      {sellModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,10,20,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setSellModal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-xl font-bold text-gray-900">Sell Tokens</h3>
              <button onClick={() => setSellModal(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-5">
              {sellModal.property.name} — You own <strong>{sellModal.tokensOwned}</strong> tokens
            </p>

            <label className="text-xs font-medium text-gray-500 block mb-1.5">Tokens to Sell</label>
            <div className="relative mb-3">
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0"
                min="1"
                max={sellModal.tokensOwned}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent pr-16"
              />
              <button
                onClick={() => setSellAmount(sellModal.tokensOwned.toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 text-xs font-bold"
              >
                MAX
              </button>
            </div>

            {sellAmount && parseFloat(sellAmount) > 0 && (
              <div className="p-3 bg-purple-50 rounded-xl mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated value:</span>
                  <span className="font-bold text-purple-700">
                    {(parseFloat(sellAmount) * sellModal.property.pricePerToken).toLocaleString()} FCV
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSellModal(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSell}
                disabled={isSelling || !sellAmount || parseFloat(sellAmount) <= 0}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {isSelling
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Selling…</>
                  : 'Sell Tokens'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}