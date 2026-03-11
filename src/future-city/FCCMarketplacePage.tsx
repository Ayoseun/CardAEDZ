import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Tag, BarChart2, List, Search,
  X, AlertCircle, ChevronLeft, ChevronRight,
  Info, Ban, RefreshCw, Eye, Pencil, Trash2, ChevronDown, Check,
} from 'lucide-react';
import type { MarketListing, ListingStatus, UserFccActivity, PlatformStats, MarketDepth } from './types';

import {
  createListing, fetchAllListings,
  fetchUserActivity, fetchPlatformStats, fetchMarketDepth,
  editListing as apiEditListing, cancelListing as apiCancelListing,
} from './marketplace';
import toast from 'react-hot-toast';


function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function StatusBadge({ status }: { status: ListingStatus }) {
  const map: Record<ListingStatus, { label: string; cls: string }> = {
    active: { label: 'Active', cls: 'bg-green-100  text-green-700' },
    fully_sold: { label: 'Fully Sold', cls: 'bg-blue-100   text-blue-700' },
    completed: { label: 'Completed', cls: 'bg-gray-100   text-gray-600' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-100    text-red-600' },
    pending: { label: 'Pending', cls: 'bg-amber-100  text-amber-700' },
  };
  const { label, cls } = map[status] ?? map.pending;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
}

// Suppress unused warning — StatusBadge is kept for potential reuse
void StatusBadge;

function ListingStatusBadge({ status, soldPct }: { status: ListingStatus; soldPct: number }) {
  const derived = status === 'active' && soldPct > 0 ? 'partially_sold' : status;

  const map: Record<string, { label: string; cls: string }> = {
    active: { label: 'Active', cls: 'bg-green-100 text-green-700 border border-green-200' },
    partially_sold: { label: 'Partially Sold', cls: 'bg-orange-100 text-orange-600 border border-orange-200' },
    fully_sold: { label: 'Fully Sold', cls: 'bg-violet-100 text-violet-700 border border-violet-200' },
    completed: { label: 'Completed', cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
    cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
    pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  };
  const { label, cls } = map[derived] ?? map['pending'];
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

// ─── List FCC Modal ───────────────────────────────────────────────────────────

interface ListModalProps {
  fccBalance: number;
  aedzAddress?: string;
  onClose: () => void;
  onList: (amount: number, price: number, aedzAddress: string) => Promise<void>;
}

function ListFCCModal({ fccBalance, aedzAddress = '', onClose, onList }: ListModalProps) {
  const [step, setStep] = useState<1 | 2 | 'success'>(1);
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PCT_SHORTCUTS = ['25%', '50%', '75%', '100%'];
  const numAmount = parseFloat(amount) || 0;
  const numPrice = parseFloat(price) || 0;
  const totalValue = numAmount * numPrice;

  function applyPct(pct: string) {
    setAmount(String(Math.floor(fccBalance * parseFloat(pct) / 100)));
  }

  async function handleContinue() {
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError(null);
    try {
      await onList(numAmount, numPrice, aedzAddress);
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,10,20,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={step === 'success' ? onClose : undefined}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>

        {/* ── Success screen ─────────────────────────────────────────────── */}
        {step === 'success' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Listing Created!</h3>
            <p className="text-sm text-gray-400 mb-5">Your FCC listing has been submitted and is awaiting funds reservation.</p>

            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 text-left mb-5">
              {[
                ['FCC Listed', `${fmt(numAmount)} FCC`],
                ['Price', `${numPrice.toFixed(2)} AEDZ/FCC`],
                ['Total Value', `${fmt(totalValue, 2)} AEDZ`],
                ['Status', 'Awaiting reservation'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
            </div>

            <div className="bg-violet-50 rounded-xl p-3 text-xs text-violet-700 text-left space-y-1 mb-5">
              <p className="font-semibold">What happens next:</p>
              <p>• Your FCC will be locked while funds are reserved</p>
              <p>• FutureCo will buy back from lowest price to highest</p>
              <p>• You can edit or cancel this listing at any time</p>
            </div>

            <button onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-700 transition-all">
              Done
            </button>
          </div>
        )}

        {/* ── Step 1 & 2 ────────────────────────────────────────────────── */}
        {step !== 'success' && (
          <>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {step === 1 ? 'List FCC on Marketplace' : 'Confirm Listing'}
              </h3>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">

              {step === 1 && (
                <>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Available FCC Balance</p>
                    <p className="text-2xl font-bold text-gray-900">{fmt(fccBalance)} <span className="text-sm font-medium text-gray-400">FCC</span></p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Amount of FCC to list</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
                    <div className="flex gap-2 mt-2">
                      {PCT_SHORTCUTS.map(p => (
                        <button key={p} onClick={() => applyPct(p)}
                          className="flex-1 py-1 text-xs border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Price per FCC (AEDZ)</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex gap-2">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>Your FCC will be locked until sold or you cancel the listing. You can edit or cancel anytime.</span>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="bg-purple-50 rounded-2xl p-5 text-center">
                    <p className="text-xs text-gray-400 mb-1">FCC to list</p>
                    <p className="text-4xl font-bold text-gray-900">{fmt(numAmount)} <span className="text-lg font-medium text-gray-400">FCC</span></p>
                  </div>

                  <div className="space-y-3">
                    {[
                      ['FCC Amount', `${fmt(numAmount)} FCC`],
                      ['Price/FCC', `${numPrice.toFixed(2)} AEDZ`],
                      ['Total Value', `${fmt(totalValue, 2)} AEDZ`],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-semibold text-gray-800">{val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex gap-2">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>By confirming, your FCC will be locked and the listing will be submitted for buyback processing.</span>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex gap-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-2">
              {step === 2 && (
                <button onClick={() => { setStep(1); setError(null); }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Back
                </button>
              )}
              <button
                onClick={handleContinue}
                disabled={!numAmount || !numPrice || loading}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                  : step === 1 ? 'Continue' : 'Confirm & List'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── View Listing Modal ────────────────────────────────────────────────────────

interface ViewListingModalProps {
  listing: MarketListing;
  onClose: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

function ViewListingModal({ listing, onClose, onEdit, onCancel }: ViewListingModalProps) {
  const soldFcc = listing.fccAmount - (listing.remaining ?? listing.fccAmount);
  const remaining = listing.remaining ?? listing.fccAmount;
  const soldPct = listing.fccAmount > 0 ? Math.round((soldFcc / listing.fccAmount) * 100) : 0;
  const totalValue = listing.fccAmount * listing.price;
  const totalEarned = soldFcc * listing.price;
  const isEditable = listing.status === 'active' || listing.status === 'pending';
  const canEdit = listing.isOwn && isEditable;

  const timeline = [
    { label: 'Listing created', detail: `Total FCC Listed: ${fmt(listing.fccAmount)} FCC\nListing price: ${listing.price} AEDZ`, time: listing.dateTime },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,10,20,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-xs font-medium text-gray-400">FCC Listed</p>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <div className="flex flex-col items-center pb-4 px-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{fmt(listing.fccAmount)} FCC</p>
        </div>

        <div className="px-5 pb-5 space-y-4">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Listing ID</p>
              <p className="text-sm font-bold text-gray-900">{listing.listingId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Date & Time</p>
              <p className="text-sm font-medium text-gray-700">{listing.dateTime}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Status</p>
              <ListingStatusBadge status={listing.status} soldPct={soldPct} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total Earned</p>
              <p className="text-sm font-bold text-green-500">{fmt(totalEarned, 2)} AEDZ</p>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
            {[
              ['Price Per Listed', `${listing.price} AEDZ`],
              ['FCC Listed', `${fmt(listing.fccAmount)} FCC`],
              ['FCC Sold', `${fmt(soldFcc)} FCC`],
              ['Remaining FCC:', `${fmt(remaining)} FCC`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between px-3 py-2.5">
                <span className="text-sm text-gray-400">{k}</span>
                <span className="text-sm font-semibold text-gray-800">{v}</span>
              </div>
            ))}
            <div className="flex justify-between px-3 py-2.5 bg-gray-50 rounded-b-xl">
              <span className="text-sm font-bold text-gray-700">Total Value</span>
              <span className="text-sm font-bold text-gray-900">{fmt(totalValue, 0)} AEDZ</span>
            </div>
          </div>

          <div className="bg-violet-50 rounded-xl p-3">
            <div className="flex justify-between mb-2">
              <p className="text-xs font-semibold text-gray-700">Sale Progress</p>
              <p className="text-xs text-gray-500">{fmt(soldFcc)}/{fmt(listing.fccAmount)} FCC sold ({soldPct}%)</p>
            </div>
            <div className="h-2.5 bg-violet-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full"
                style={{
                  width: `${soldPct}%`,
                  backgroundImage: 'repeating-linear-gradient(45deg, #7c3aed 0px, #7c3aed 4px, #a78bfa 4px, #a78bfa 8px)',
                }} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 inline-block" />
              Timeline of Listing
            </p>
            <div className="space-y-3">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500 flex-shrink-0 mt-0.5" />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-violet-200 mt-1" />}
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                      <p className="text-xs text-gray-400">{t.time}</p>
                    </div>
                    {t.detail.split('\n').map((line, j) => (
                      <p key={j} className="text-xs text-gray-500">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canEdit && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <button onClick={onEdit}
                className="py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors">
                <Pencil className="w-4 h-4" /> Edit Listing
              </button>
              <button onClick={onCancel}
                className="py-3 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 flex items-center justify-center gap-1.5 transition-colors">
                <X className="w-4 h-4" /> Cancel Listing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Listing Modal ────────────────────────────────────────────────────────

interface EditListingModalProps {
  listing: MarketListing;
  fccBalance: number;
  onClose: () => void;
  onSave: (listing: MarketListing, newAmount: number, newPrice: number) => void;
}

function EditListingModal({ listing, fccBalance, onClose, onSave }: EditListingModalProps) {
  const [newPrice, setNewPrice] = useState(String(listing.price));
  const [newAmount, setNewAmount] = useState(String(listing.fccAmount));
  const PCT = ['25%', '50%', '75%', '100%'];

  const soldFcc = listing.fccAmount - (listing.remaining ?? listing.fccAmount);
  const available = fccBalance;
  const numAmount = parseFloat(newAmount) || 0;
  const numPrice = parseFloat(newPrice) || 0;
  const newTotal = numAmount * numPrice;
  const isOverLimit = numAmount > available;

  function applyPct(pct: string) {
    setNewAmount(String(Math.floor(available * parseFloat(pct) / 100)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,10,20,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Edit Listing</h3>
            <p className="text-xs text-gray-400">Update your FCC amount and price</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">

          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 mb-2">Current Listing</p>
            {[
              ['FCC Amount', `${fmt(listing.fccAmount)} FCC`],
              ['Current Price', `${listing.price} AEDZ/FCC`],
              ['FCC Sold', `${fmt(soldFcc)} FCC`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-xs text-gray-400">{k}</span>
                <span className={`text-xs font-semibold ${k === 'FCC Sold' ? 'text-red-500' : 'text-gray-800'}`}>{v}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">FCC Amount</label>
              <span className="text-xs text-gray-400">Available: {fmt(available)} FCC</span>
            </div>
            <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent ${isOverLimit ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
            {isOverLimit && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Amount exceeds available balance
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {PCT.map(p => (
                <button key={p} onClick={() => applyPct(p)}
                  className="flex-1 py-1 text-xs border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">FCV Price per FCC (AEDZ)</label>
            <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
              placeholder="1.00"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent" />
          </div>

          <div className="space-y-1.5">
            {[
              ['FCC Amount to list', `${fmt(numAmount)} FCC`],
              ['New FCV Price', `${numPrice.toFixed(2)} AEDZ/FCC`],
              ['New Total Value', `${fmt(newTotal, 2)} AEDZ`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-semibold text-gray-800">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => onSave(listing, numAmount, numPrice)}
            disabled={!numAmount || !numPrice || isOverLimit}
            className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-700 disabled:opacity-40 transition-all">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cancel Listing Modal ─────────────────────────────────────────────────────

interface CancelListingResult {
  returnedFcc?: number;
  newFccBalance?: number;
}

interface CancelModalProps {
  listing: MarketListing;
  onClose: () => void;
  onConfirm: () => Promise<CancelListingResult | undefined>;
}

function CancelListingModal({ listing, onClose, onConfirm }: CancelModalProps) {
  const [done, setDone] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState<CancelListingResult | undefined>();

  const soldFcc = listing.fccAmount - (listing.remaining ?? listing.fccAmount);
  const lostFee = soldFcc * listing.price * 0.05;
  const toReturn = listing.fccAmount - soldFcc;

  async function handleConfirm() {
    setIsCancelling(true);
    try {
      const result = await onConfirm();
      setCancelResult(result);
      setDone(true);
      toast.success('Listing cancelled successfully');
    } catch {
      // error toast already handled by parent
    } finally {
      setIsCancelling(false);
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(10,10,20,0.65)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}>
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full"><X className="w-4 h-4 text-gray-400" /></button>

          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Ban className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Listing Cancelled!</h3>
          <p className="text-gray-400 text-sm mb-4">Your listing has been removed from the marketplace</p>

          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 text-left mb-4">
            {[
              ['FCC Returned', `${fmt(cancelResult?.returnedFcc ?? toReturn)} FCC`],
              ['New FCC Balance', `${fmt(cancelResult?.newFccBalance ?? listing.fccAmount)} FCC`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="font-semibold text-gray-800">{v}</span>
              </div>
            ))}
          </div>

          <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-700 text-left space-y-1 mb-5">
            <p className="font-semibold">What's next:</p>
            <p>• Your FCC is now available in your wallet</p>
            <p>• The listing has been removed from the marketplace</p>
            <p>• You can create a new listing anytime</p>
            <p>• No fees for cancelling or relisting so far</p>
          </div>

          <button onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-700">
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,10,20,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-5 h-5 text-red-500" />
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-1">Cancel Listing</h3>
        <p className="text-gray-400 text-sm mb-4">Are you sure you want to cancel this listing? This action cannot be undone.</p>

        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 mb-4">
          {[
            ['Total FCC Listed', `${fmt(listing.fccAmount)} FCC`],
            ['FCC Reward Fees', `-${fmt(lostFee, 2)} FCC`],
            ['Listing Price', `${listing.price} AEDZ`],
            ['Total FCC to be Returned', `${fmt(toReturn)} FCC`],
          ].map(([k, v]) => (
            <div key={k} className={`flex justify-between ${k === 'Total FCC to be Returned' ? 'border-t border-gray-200 pt-2 font-semibold' : ''}`}>
              <span className="text-gray-500">{k}</span>
              <span className={k === 'FCC Reward Fees' ? 'text-red-500 font-semibold' : 'font-semibold text-gray-800'}>{v}</span>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 space-y-1 mb-5">
          <p className="font-semibold">What happens when you cancel:</p>
          <p>• Your listing will be immediately removed from the marketplace</p>
          <p>• Unsold FCC will be returned to your wallet</p>
          <p>• The sale cannot be undone once confirmed</p>
          <p>• You can create a new listing anytime</p>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isCancelling}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {isCancelling
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting…</>
              : 'Delete Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Main Marketplace Page ────────────────────────────────────────────────────

interface FCCMarketplacePageProps {
  fccBalance: number;
  walletAddress?: string;
  accessToken?: string;
  apiUrl?: string;
  userId?: string;
}

type StatusFilter = '' | 'active' | 'fully_sold' | 'partially_sold' | 'cancelled' | 'pending' | 'completed';

const FILTER_OPTIONS: { label: string; status: StatusFilter }[] = [
  { label: 'All Listings', status: '' },
  { label: 'Active', status: 'active' },
  { label: 'Partially Sold', status: 'partially_sold' },
  { label: 'Fully Sold', status: 'fully_sold' },
  { label: 'Pending', status: 'pending' },
  { label: 'Completed', status: 'completed' },
  { label: 'Cancelled', status: 'cancelled' },
];

const PAGE_SIZE = 50;

export default function FCCMarketplacePage({
  fccBalance,
  walletAddress,
  accessToken = '',
  apiUrl = 'localhost',
  userId,
}: FCCMarketplacePageProps) {

  // ── Modal state ──────────────────────────────────────────────────────────
  const [showListModal, setShowListModal] = useState(false);
  const [viewListing, setViewListing] = useState<MarketListing | null>(null);
  const [editingListing, setEditingListing] = useState<MarketListing | null>(null);
  // Renamed from cancelListing → cancelTarget to avoid shadowing the imported apiCancelListing
  const [cancelTarget, setCancelTarget] = useState<MarketListing | null>(null);

  // ── Listings state ───────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

  // ── Stats state ──────────────────────────────────────────────────────────
  const [activity, setActivity] = useState<UserFccActivity | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [marketDepth, setMarketDepth] = useState<MarketDepth | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Load stats ────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    if (!accessToken) return;
    setStatsLoading(true);
    try {
      const [act, stats, depth] = await Promise.allSettled([
        fetchUserActivity(accessToken, apiUrl),
        fetchPlatformStats(accessToken, apiUrl),
        fetchMarketDepth(accessToken, apiUrl),
      ]);
      if (act.status === 'fulfilled') setActivity(act.value);
      if (stats.status === 'fulfilled') setPlatformStats(stats.value);
      if (depth.status === 'fulfilled') setMarketDepth(depth.value);
    } finally {
      setStatsLoading(false);
    }
  }, [accessToken, apiUrl]);

  // ── Load listings ─────────────────────────────────────────────────────────
  const listingsReqId = useRef(0);

  const loadListings = useCallback(async () => {
    if (!accessToken) return;
    const reqId = ++listingsReqId.current;
    setListingsLoading(true);
    setListingsError(null);
    setListings([]);
    try {
      const apiStatus = statusFilter === 'partially_sold' ? 'active' : (statusFilter || undefined);
      const result = await fetchAllListings({ page, limit: PAGE_SIZE, status: apiStatus, accessToken, apiUrl, userId });
      if (reqId !== listingsReqId.current) return;
      setListings(result.listings);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      if (reqId !== listingsReqId.current) return;
      setListingsError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      if (reqId === listingsReqId.current) setListingsLoading(false);
    }
  }, [accessToken, apiUrl, statusFilter, page, userId]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadListings(); }, [loadListings]);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Client-side search + partially_sold filter ───────────────────────────
  const filtered = listings.filter(l => {
    if (search && !l.listingId.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === 'partially_sold') {
      const sold = l.fccAmount - (l.remaining ?? l.fccAmount);
      const pct = l.fccAmount > 0 ? (sold / l.fccAmount) * 100 : 0;
      return l.status === 'active' && pct > 0;
    }
    return true;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleList(amount: number, price: number, aedzAddress: string) {
    if (!accessToken) throw new Error('Not authenticated');
    await createListing(
      { fcc_amount: amount, price_aedz: price, aedz_address: aedzAddress },
      accessToken,
      apiUrl,
    );
    loadListings();
    loadStats();
  }

  async function handleEditSave(listing: MarketListing, newAmount: number, newPrice: number) {
    if (!accessToken) return;
    try {
      await apiEditListing(
        listing.listingId,
        { fcc_amount: newAmount, price_aedz: newPrice },
        accessToken,
        apiUrl,
      );
      toast.success('Listing updated!');
      setEditingListing(null);
      loadListings();
      loadStats();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update listing');
    }
  }

  async function handleCancelConfirm(listing: MarketListing): Promise<CancelListingResult | undefined> {
    if (!accessToken) return undefined;
    try {
      const result = await apiCancelListing(listing.listingId, accessToken, apiUrl);
      return result;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel listing');
      throw err;
    }
  }

  // Called when the cancel modal fully closes (after success screen dismissed)
  function handleCancelDone() {
    setCancelTarget(null);
    loadListings();
    loadStats();
  }

  // ── Skeleton helper ────────────────────────────────────────────────────────
  const Sk = ({ w = 'w-20', h = 'h-4' }: { w?: string; h?: string }) => (
    <div className={`${w} ${h} bg-gray-100 rounded animate-pulse`} />
  );

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">FCC Marketplace</h2>
          <p className="text-gray-400 text-sm mt-0.5">Manage your FCC listings and track platform activity.</p>
        </div>
        <button
          onClick={() => setShowListModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-700 transition-all shadow-md flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Create Listing
        </button>
      </div>

      {/* ── Info banner ───────────────────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-amber-700">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>Important: FCC is not tradeable peer-to-peer. FCC can only be sold to FutureCo. Buybacks occur automatically from lowest price to highest.</span>
      </div>

      {/* ── Your FCC Activity ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Your FCC Activity</h3>
          <button onClick={loadStats} disabled={statsLoading}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${statsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'FCC Balance', value: activity?.fccBalance, suffix: 'FCC', sub: 'FCC held in wallet', color: 'text-gray-900' },
            { label: 'Total FCC Listed', value: activity?.totalFccListed, suffix: 'FCC', sub: 'Currently on marketplace', color: 'text-indigo-600' },
            { label: 'Total FCC Sold', value: activity?.totalFccsold, suffix: 'FCC', sub: 'All-time sold', color: 'text-green-600' },
            { label: 'Active Listings', value: activity?.activeListings, suffix: '', sub: `${activity?.earningsAedz ?? 0} AEDZ earned`, color: 'text-purple-600' },
          ].map(({ label, value, suffix, sub, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-gray-400 text-xs mb-1">{label}</p>
              {statsLoading || value == null
                ? <Sk w="w-24" h="h-7" />
                : <p className={`text-xl font-bold ${color}`}>
                  {fmt(value)} <span className="text-xs text-gray-400 font-normal">{suffix}</span>
                </p>}
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Platform Statistics + Market Depth ─────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex overflow-hidden">

        <div className="w-72 flex-shrink-0 p-6 border-r border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-0.5">Platform Statistics</h3>
          <p className="text-xs text-gray-400 mb-6">Key metrics showing FCC performance</p>

          {statsLoading || !platformStats ? (
            <div className="space-y-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Sk w="w-10" h="h-10" />
                  <div className="space-y-1.5 flex-1"><Sk w="w-28" h="h-2.5" /><Sk w="w-20" h="h-5" /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-1">Total FCC Bought by FutureCity</p>
                  <p className="text-lg font-bold text-gray-900 leading-none">
                    {fmt(platformStats.totalFccBoughtByCity)}
                    <span className="text-xs font-semibold text-gray-400 ml-1">FCC</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2a7 7 0 1 1 0 14A7 7 0 0 1 12 2z" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <circle cx="12" cy="17" r=".5" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-1">Total AEDZ Paid to Users</p>
                  <p className="text-lg font-bold text-gray-900 leading-none">
                    {fmt(platformStats.totalAedzPaidToUsers)}
                    <span className="text-xs font-semibold text-gray-400 ml-1">AEDZ</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-1">Active Listings</p>
                  <p className="text-lg font-bold text-gray-900 leading-none">
                    {fmt(platformStats.activeListingsCount)}
                    <span className="text-xs font-semibold text-gray-400 ml-1">Total</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-1">30-Day Avg Buyback Price</p>
                  <p className="text-lg font-bold text-gray-900 leading-none">
                    {platformStats.avgBuybackPrice30d}
                    <span className="text-xs font-semibold text-gray-400 ml-1">AEDZ</span>
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

        <div className="flex-1 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-0.5">Market Depth</h3>
          <p className="text-xs text-gray-400 mb-5">This is a read only view of current FCC sell orders listed by all users</p>

          {statsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map(j => <Sk key={j} w="w-full" h="h-4" />)}
                </div>
              ))}
            </div>
          ) : (marketDepth?.buyOrders ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <BarChart2 className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">No Sell Orders Available</p>
              <p className="text-xs text-gray-400 max-w-xs">There are currently no FCC sell orders listed. Check back later or create a listing.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(marketDepth?.buyOrders ?? []).map((o, i) => (
                <div key={i} className="border border-gray-100 rounded-xl px-4 py-3.5 flex items-start">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">FCC Amount</p>
                    <p className="text-sm font-bold text-gray-900">{fmt(o.fccAmount)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">Price</p>
                    <p className="text-sm font-bold text-green-500">{(o.price ?? 0).toFixed(2)} AEDZ</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">Date & Time</p>
                    <p className="text-sm font-medium text-gray-800">{o.date}</p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-gray-400 mb-1">Total Value</p>
                    <p className="text-sm font-bold text-gray-900">{fmt(o.totalValue ?? 0)} AEDZ</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── My FCC Listings table ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">My FCC Listings</h3>
            <p className="text-xs text-gray-400">Manage your active and past FCC listings</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by listing ID"
                className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 w-44"
              />
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-2 border border-violet-400 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-w-[140px] justify-between">
                <span>
                  {FILTER_OPTIONS.find(o => o.status === statusFilter)?.label ?? 'All Listings'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-dashed border-violet-300 rounded-xl shadow-lg z-20 min-w-[160px] py-1 overflow-hidden">
                  {FILTER_OPTIONS.map(opt => {
                    const isActive = opt.status === statusFilter;
                    return (
                      <button key={opt.label}
                        onClick={() => {
                          setStatusFilter(opt.status);
                          setDropdownOpen(false);
                          setPage(1);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        {opt.label}
                        {isActive && <Check className="w-4 h-4 text-violet-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={() => { loadListings(); loadStats(); }}
              disabled={listingsLoading || statsLoading}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${listingsLoading || statsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-sm text-gray-400 font-medium pb-3 pr-8">Listing ID</th>
                <th className="text-left text-sm text-gray-400 font-medium pb-3 pr-8">Price (AEDZ)</th>
                <th className="text-left text-sm text-gray-400 font-medium pb-3 pr-8">Listed FCC</th>
                <th className="text-left text-sm text-gray-400 font-medium pb-3 pr-8">Sold</th>
                <th className="text-left text-sm text-gray-400 font-medium pb-3 pr-8">Date & Time</th>
                <th className="text-left text-sm text-gray-400 font-medium pb-3 pr-8">Status</th>
                <th className="text-left text-sm text-gray-400 font-medium pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listingsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[1, 2, 3, 4, 5, 6, 7].map(j => (
                      <td key={j} className="py-5 pr-8"><Sk w="w-full" h="h-3" /></td>
                    ))}
                  </tr>
                ))
              ) : listingsError ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <AlertCircle className="w-8 h-8 text-red-300 mx-auto mb-2" />
                    <p className="text-red-500 text-sm font-medium">{listingsError}</p>
                    <button onClick={loadListings}
                      className="mt-3 px-4 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-xs font-semibold">
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                        <List className="w-6 h-6 text-purple-300" />
                      </div>
                      <p className="text-gray-500 font-medium text-sm">No Active Listing</p>
                      <p className="text-gray-400 text-xs mt-1">No listings found. Try a different filter or create a new listing.</p>
                      <button onClick={() => setShowListModal(true)}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-xs font-semibold">
                        List FCC for Sale
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(listing => {
                  const soldFcc = listing.fccAmount - (listing.remaining ?? listing.fccAmount);
                  const soldPct = listing.fccAmount > 0
                    ? Math.min(100, Math.round((soldFcc / listing.fccAmount) * 100))
                    : 0;
                  const isActive = listing.status === 'active';
                  const canEdit = listing.isOwn && isActive;
                  const canCancel = listing.isOwn && isActive;

                  return (
                    <tr key={listing.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">

                      <td className="py-5 pr-8">
                        <span className="font-semibold text-gray-800 text-sm">{listing.listingId}</span>
                      </td>

                      <td className="py-5 pr-8">
                        <span className="font-semibold text-green-500 text-sm">{listing.price}</span>
                      </td>

                      <td className="py-5 pr-8">
                        <span className="font-semibold text-gray-800 text-sm">{fmt(listing.fccAmount)}</span>
                      </td>

                      <td className="py-5 pr-8">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-gray-500 text-xs">{fmt(soldFcc)}/{fmt(listing.fccAmount)}</span>
                          <div className="w-28 h-2 bg-violet-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${soldPct}%`,
                                backgroundImage: 'repeating-linear-gradient(45deg, #7c3aed 0px, #7c3aed 4px, #a78bfa 4px, #a78bfa 8px)',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-5 pr-8">
                        <span className="text-gray-600 text-sm whitespace-nowrap">{listing.dateTime}</span>
                      </td>

                      <td className="py-5 pr-8">
                        <ListingStatusBadge status={listing.status} soldPct={soldPct} />
                      </td>

                      <td className="py-5">
                        {listing.isOwn && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setViewListing(listing)}
                              title="View listing"
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={canEdit ? () => setEditingListing(listing) : undefined}
                              title={canEdit ? 'Edit listing' : 'Cannot edit this listing'}
                              disabled={!canEdit}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                                canEdit
                                  ? 'border-gray-300 text-gray-800 hover:bg-gray-100 hover:border-gray-400 cursor-pointer'
                                  : 'border-gray-300 text-gray-400 cursor-not-allowed'
                              }`}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={canCancel ? () => setCancelTarget(listing) : undefined}
                              title={canCancel ? 'Delete listing' : 'Cannot delete this listing'}
                              disabled={!canCancel}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                                canCancel
                                  ? 'border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 cursor-pointer'
                                  : 'border-gray-300 text-gray-400 cursor-not-allowed'
                              }`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="w-3 h-3" /> Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-purple-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showListModal && (
        <ListFCCModal
          fccBalance={fccBalance}
          aedzAddress={walletAddress}
          onClose={() => setShowListModal(false)}
          onList={handleList}
        />
      )}

      {viewListing && !editingListing && !cancelTarget && (
        <ViewListingModal
          listing={viewListing}
          onClose={() => setViewListing(null)}
          onEdit={() => { setEditingListing(viewListing); setViewListing(null); }}
          onCancel={() => { setCancelTarget(viewListing); setViewListing(null); }}
        />
      )}

      {editingListing && (
        <EditListingModal
          listing={editingListing}
          fccBalance={fccBalance}
          onClose={() => setEditingListing(null)}
          onSave={handleEditSave}
        />
      )}

      {cancelTarget && (
        <CancelListingModal
          listing={cancelTarget}
          onClose={handleCancelDone}
          onConfirm={() => handleCancelConfirm(cancelTarget)}
        />
      )}
    </div>
  );
}