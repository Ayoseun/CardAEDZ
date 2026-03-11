import { useState } from 'react';
import { ArrowLeft, CheckCircle, Shield, Building2, AlertTriangle, Loader } from 'lucide-react';
import type { Property } from './types';
import toast from 'react-hot-toast';

interface CheckoutPageProps {
  property: Property;
  initialTokens: number;
  fcvBalance: string;
  onBack: () => void;
  onConfirm: (propertyId: string, tokenAmount: number) => Promise<void>;
  onSuccess: () => void;
}

function formatFCV(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M FCV`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K FCV`;
  return `${value} FCV`;
}

type Step = 'review' | 'confirm' | 'success';

export default function CheckoutPage({ property, initialTokens, fcvBalance, onBack, onConfirm, onSuccess }: CheckoutPageProps) {
  const [tokenAmount, setTokenAmount] = useState(initialTokens);
  const [step, setStep] = useState<Step>('review');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const totalCost = tokenAmount * property.pricePerToken;
  const canAfford = totalCost <= parseFloat(fcvBalance);
  const ownershipPercent = ((tokenAmount / property.totalTokens) * 100).toFixed(4);
  const estimatedYearlyReturn = (totalCost * property.annualYield / 100).toFixed(2);

  const handleConfirm = async () => {
    if (!agreedToTerms) { toast.error('Please agree to the terms'); return; }
    setIsProcessing(true);
    try {
      await onConfirm(property.id, tokenAmount);
      setStep('success');
    } catch (e) {
      console.error(e);
      toast.error('Investment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Investment Successful!</h2>
          <p className="text-gray-500 text-sm mb-6">
            You've successfully invested in <strong>{property.name}</strong>.
            Your tokens will appear in My Investments shortly.
          </p>

          {/* Summary card */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2">
            {[
              ['Tokens Purchased', `${tokenAmount} tokens`],
              ['Total Invested', `${totalCost.toLocaleString()} FCV`],
              ['Ownership Share', `${ownershipPercent}%`],
              ['Est. Yearly Return', `${parseFloat(estimatedYearlyReturn).toLocaleString()} FCV`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onSuccess}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold hover:from-violet-600 hover:to-purple-700 transition-all"
            >
              View My Investments
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Back to Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top nav ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Property
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-500 text-sm">Checkout</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Investment</h1>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT: Steps ── */}
          <div className="flex-1 space-y-5">

            {/* Property summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                <img src={property.cover_image} alt={property.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm leading-tight">{property.name}</h3>
                <p className="text-gray-400 text-xs mt-0.5">{property.location}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1 text-purple-600 font-semibold">{property.expectedReturn}% ROI</span>
                  <span className="flex items-center gap-1 text-green-600 font-semibold">{property.annualYield}% Yield</span>
                </div>
              </div>
            </div>

            {/* Token amount */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Investment Amount</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Number of Tokens</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTokenAmount((v) => Math.max(1, v - 1))}
                      className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold text-xl transition-colors"
                    >−</button>
                    <input
                      type="number"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(Math.max(1, Math.min(property.availableTokens, parseInt(e.target.value) || 1)))}
                      className="flex-1 text-center py-2.5 border border-gray-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    />
                    <button
                      onClick={() => setTokenAmount((v) => Math.min(property.availableTokens, v + 1))}
                      className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold text-xl transition-colors"
                    >+</button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 text-center">
                    Max available: {property.availableTokens.toLocaleString()} tokens · {formatFCV(property.pricePerToken)} each
                  </p>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={1}
                  max={Math.min(property.availableTokens, Math.max(1, Math.floor(parseFloat(fcvBalance) / property.pricePerToken)))}
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(parseInt(e.target.value))}
                  className="w-full accent-purple-600"
                />

                {/* Investment breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Token Price', value: `${property.pricePerToken} FCV` },
                    { label: 'Total Cost', value: `${totalCost.toLocaleString()} FCV`, highlight: !canAfford },
                    { label: 'Ownership Share', value: `${ownershipPercent}%` },
                    { label: 'Est. Yearly Return', value: `${parseFloat(estimatedYearlyReturn).toLocaleString()} FCV` },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className={`font-bold text-sm ${highlight ? 'text-red-500' : 'text-gray-900'}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {!canAfford && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600">
                      Insufficient FCV balance. You have {parseFloat(fcvBalance).toFixed(2)} FCV but need {totalCost.toLocaleString()} FCV.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cool-off notice */}
            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Cool-Off Period</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  You have 90 days from the investment date to withdraw your funds during the cool-off period.
                  After this period, your investment will be locked until the property is sold or tokens are listed on the marketplace.
                </p>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-purple-600 rounded"
                />
                <span className="text-sm text-gray-600">
                  I understand and agree to the{' '}
                  <button className="text-purple-600 font-medium hover:underline">Terms of Investment</button>
                  {' '}and{' '}
                  <button className="text-purple-600 font-medium hover:underline">Risk Disclosure</button>.
                  I acknowledge the cool-off period terms and that returns are not guaranteed.
                </span>
              </label>
            </div>
          </div>

          {/* ── RIGHT: Order summary (dark) ── */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-[#1a1f36] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-white/10">
                  <h3 className="text-white font-bold text-base">Order Summary</h3>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: 'Property', value: property.name.length > 25 ? property.name.slice(0, 25) + '…' : property.name },
                    { label: 'Tokens', value: tokenAmount.toLocaleString() },
                    { label: 'Price / Token', value: `${property.pricePerToken} FCV` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-white/50 text-sm">{label}</span>
                      <span className="text-white text-sm font-medium">{value}</span>
                    </div>
                  ))}

                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Total</span>
                      <span className={`font-bold text-lg ${canAfford ? 'text-white' : 'text-red-400'}`}>
                        {totalCost.toLocaleString()} FCV
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-white/40 text-xs">Balance after</span>
                      <span className={`text-xs ${canAfford ? 'text-white/50' : 'text-red-400'}`}>
                        {canAfford ? (parseFloat(fcvBalance) - totalCost).toFixed(2) : '—'} FCV
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button
                    onClick={handleConfirm}
                    disabled={!canAfford || !agreedToTerms || isProcessing}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <><Loader className="w-4 h-4 animate-spin" /> Processing…</>
                    ) : (
                      'Confirm Investment'
                    )}
                  </button>
                  {!agreedToTerms && (
                    <p className="text-white/30 text-xs text-center mt-2">Please agree to terms first</p>
                  )}
                </div>

                {/* Trust */}
                <div className="px-5 pb-5 space-y-2">
                  {[
                    { icon: Shield, text: 'Secured by smart contract' },
                    { icon: Building2, text: 'Regulated investment' },
                    { icon: CheckCircle, text: 'Legally verified' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-white/30" />
                      <span className="text-white/30 text-xs">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
