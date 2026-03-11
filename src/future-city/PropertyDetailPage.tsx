import { useState, useEffect } from 'react';
import {
  ArrowLeft, Heart, MapPin, Bed, Bath, Maximize, ChevronLeft, ChevronRight,
  CheckCircle, Share2, Clock, TrendingUp, Users, BarChart3, FileText,
  Building2, Star, Shield, Info,
} from 'lucide-react';
import type { Property } from './types';
import { fetchPropertyById } from './utils/properties';

interface PropertyDetailPageProps {
  propertyId: string;                // only the ID is passed
  fcvBalance: string;
  accessToken: string;                // needed for API call
  apiUrl: string;                      // base URL
  onBack: () => void;
  onCheckout: (property: Property, tokenAmount: number) => void;
}

const STATUS_BADGE: Record<string, { label: string; textClass: string; bgClass: string }> = {
  active:            { label: 'Open',          textClass: 'text-green-700',  bgClass: 'bg-green-100'  },
  almost_funded:     { label: 'Almost Funded', textClass: 'text-orange-700', bgClass: 'bg-orange-100' },
  coming_soon:       { label: 'Coming Soon',   textClass: 'text-purple-700', bgClass: 'bg-purple-100' },
  funding_completed: { label: 'Funded',        textClass: 'text-blue-700',   bgClass: 'bg-blue-100'   },
};

function formatFCV(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M FCV`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K FCV`;
  return `${value} FCV`;
}

type Tab = 'overview' | 'financial' | 'documents' | 'location';

export default function PropertyDetailPage({
  propertyId,
  fcvBalance,
  accessToken,
  apiUrl,
  onBack,
  onCheckout,
}: PropertyDetailPageProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [tokenAmount, setTokenAmount] = useState(1);

  useEffect(() => {
    const loadProperty = async () => {
      if (!propertyId || !accessToken || !apiUrl) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchPropertyById(propertyId, accessToken);
        setProperty(data);
      } catch (err: any) {
        setError(err.message ?? 'Failed to load property details');
      } finally {
        setIsLoading(false);
      }
    };
    loadProperty();
  }, [propertyId, accessToken, apiUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4">
            <p className="font-semibold">Error loading property</p>
            <p className="text-sm mt-1">{error || 'Property not found'}</p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  // --- Data is now available ---
  const images = property.images?.length ? property.images : [property.cover_image];
  const badge = STATUS_BADGE[property.status] ?? STATUS_BADGE['active'];
  const isSoldOut = property.status === 'funding_completed';
  const isComingSoon = property.status === 'coming_soon';
  const canInvest = !isSoldOut && !isComingSoon;
  const totalCost = tokenAmount * property.pricePerToken;
  const canAfford = totalCost <= parseFloat(fcvBalance);
 

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'financial', label: 'Financial Details' },
    { id: 'documents', label: 'Documents' },
    { id: 'location', label: 'Location' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Properties
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiked((v) => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
            <Share2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* LEFT COLUMN */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Image carousel */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="relative h-72 md:h-96 bg-gray-200">
                <img
                 //@ts-ignore
                  src={images[imgIdx].url}   // ← now a string URL
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                {/* Status */}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${badge.bgClass} ${badge.textClass}`}>
                  {badge.label}
                </div>

                {/* Type */}
                <div className="absolute top-4 left-28 px-3 py-1 rounded-full bg-gray-900/70 text-white text-xs font-semibold">
                  {property.propertyType}
                </div>

                {/* Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImgIdx(i)}
                          className={`h-1.5 rounded-full transition-all ${i === imgIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Thumbnail strip (images are strings, so src is directly the URL) */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 right-4 flex gap-1.5">
                    {images.slice(0, 3).map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIdx(i)}
                        className={`w-12 h-9 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-white' : 'border-white/40'}`}
                      >
                        {/* @ts-ignore */}
                        <img src={src.url} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Property header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">{property.name}</h1>
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-1.5">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{property.location}, {property.country}</span>
                    </div>
                  </div>
                </div>

                {/* Specs row */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  {property.bedrooms !== undefined && property.bedrooms > 0 && (
                    <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-gray-400" />{property.bedrooms} Beds</span>
                  )}
                  {property.bathrooms !== undefined && (
                    <span className="flex items-center gap-1.5"><Bath className="w-4 h-4 text-gray-400" />{property.bathrooms} Baths</span>
                  )}
                  {property.sqft && (
                    <span className="flex items-center gap-1.5"><Maximize className="w-4 h-4 text-gray-400" />{property.sqft} sqm</span>
                  )}
                  {property.occupancy && (
                    <span className={`ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      property.occupancy === 'rented'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {property.occupancy === 'rented' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {property.occupancy === 'rented' ? 'Rented' : 'Vacant'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs component – same as before, unchanged */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-gray-100">
                {TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                      activeTab === id
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content – uses property data */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">About This Property</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{property.description}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Highlights</h3>
                      <div className="flex flex-wrap gap-2">
                        {property.highlights.map((h) => (
                          <span key={h} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100">
                            <CheckCircle className="w-3 h-3" /> {h}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { icon: TrendingUp, label: 'Expected ROI', value: `${property.expectedReturn}%`, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { icon: Star, label: 'Rental Yield', value: `${property.annualYield}%`, color: 'text-green-600', bg: 'bg-green-50' },
                        { icon: Users, label: 'Total Tokens', value: property.totalTokens.toLocaleString(), color: 'text-blue-600', bg: 'bg-blue-50' },
                        { icon: BarChart3, label: 'Available', value: property.availableTokens.toLocaleString(), color: 'text-orange-600', bg: 'bg-orange-50' },
                      ].map(({ icon: Icon, label, value, color, bg }) => (
                        <div key={label} className={`${bg} rounded-xl p-3`}>
                          <Icon className={`w-4 h-4 ${color} mb-1`} />
                          <p className={`font-bold ${color}`}>{value}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-semibold text-gray-700">Funding Progress</span>
                        <span className="font-bold text-purple-600">{property.fundingPercent}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all"
                          style={{ width: `${Math.min(property.fundingPercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                        <span>{formatFCV(property.fundingRaised)} raised</span>
                        <span>Goal: {formatFCV(property.fundingGoal)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'financial' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Total Property Value', value: formatFCV(property.totalValue) },
                        { label: 'Target Raise', value: formatFCV(property.fundingGoal) },
                        { label: 'Min. Investment', value: property.minInvestment ? formatFCV(property.minInvestment) : 'N/A' },
                        { label: 'Price per Token', value: `${property.pricePerToken} FCV` },
                        { label: 'Expected ROI', value: `${property.expectedReturn}%` },
                        { label: 'Annual Rental Yield', value: `${property.annualYield}%` },
                        { label: 'Total Tokens', value: property.totalTokens.toLocaleString() },
                        { label: 'Available Tokens', value: property.availableTokens.toLocaleString() },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <span className="text-sm text-gray-500">{label}</span>
                          <span className="text-sm font-bold text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex gap-3">
                      <Info className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-purple-700">Returns are projected based on current market conditions. Past performance does not guarantee future results.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div>
                    {property.documents?.length ? (
                      <div className="space-y-3">
                        {property.documents.map((doc) => (
                          <a key={doc.name} href={doc.url} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors border border-gray-100">
                            <FileText className="w-5 h-5 text-purple-500" />
                            <span className="text-sm font-medium text-gray-700">{doc.name}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No documents available yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'location' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                      <MapPin className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-800">{property.location}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{property.country}</p>
                        {property.latitude && (
                          <p className="text-xs text-gray-400 mt-1">{property.latitude}° N, {property.longitude}° E</p>
                        )}
                      </div>
                    </div>
                    {property.latitude && (
                      <div className="rounded-xl overflow-hidden border border-gray-200 h-56 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Map view</p>
                          <p className="text-xs text-gray-400">{property.latitude}° N, {property.longitude}° E</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Verified badge strip */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">FutureCity Verified Property</p>
                  <p className="text-xs text-gray-400">All properties are legally verified and audited</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold">
                <Shield className="w-4 h-4" />
                Verified
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR (dark) */}
          <div className="xl:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Investment card */}
              <div className="bg-[#1a1f36] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-white/10">
                  <p className="text-white/60 text-xs mb-1">Price per Token</p>
                  <p className="text-white text-3xl font-bold">{property.pricePerToken} <span className="text-lg font-normal text-white/60">FCV</span></p>
                  <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bgClass} ${badge.textClass}`}>
                    {badge.label}
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Expected ROI</span>
                    <span className="text-purple-400 font-bold">{property.expectedReturn}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Rental Yield</span>
                    <span className="text-green-400 font-bold">{property.annualYield}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Min. Investment</span>
                    <span className="text-white font-semibold">{property.minInvestment ? formatFCV(property.minInvestment) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Target Raise</span>
                    <span className="text-white font-semibold">{formatFCV(property.fundingGoal)}</span>
                  </div>
                  <div className="pt-1">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/50">Funding Progress</span>
                      <span className="text-white/80 font-semibold">{property.fundingPercent}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
                        style={{ width: `${Math.min(property.fundingPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {canInvest && (
                  <div className="px-5 pb-5 space-y-3">
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-white/50 text-xs mb-2">Number of Tokens</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setTokenAmount((v) => Math.max(1, v - 1))}
                          className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors font-bold text-lg"
                        >−</button>
                        <input
                          type="number"
                          value={tokenAmount}
                          onChange={(e) => setTokenAmount(Math.max(1, Math.min(property.availableTokens, parseInt(e.target.value) || 1)))}
                          className="flex-1 bg-transparent text-white text-center font-bold text-lg focus:outline-none"
                          min={1}
                          max={property.availableTokens}
                        />
                        <button
                          onClick={() => setTokenAmount((v) => Math.min(property.availableTokens, v + 1))}
                          className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors font-bold text-lg"
                        >+</button>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/50 text-sm">Total Cost</span>
                        <span className={`font-bold text-lg ${canAfford ? 'text-white' : 'text-red-400'}`}>
                          {totalCost.toLocaleString()} FCV
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-white/40 text-xs">Your Balance</span>
                        <span className="text-white/50 text-xs">{parseFloat(fcvBalance).toFixed(2)} FCV</span>
                      </div>
                      {!canAfford && (
                        <p className="text-red-400 text-xs mt-1">Insufficient FCV balance</p>
                      )}
                    </div>
                    <button
                      onClick={() => onCheckout(property, tokenAmount)}
                      disabled={!canAfford || tokenAmount < 1}
                      className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
                    >
                      Invest Now
                    </button>
                    <p className="text-white/30 text-xs text-center">
                      Max {property.availableTokens.toLocaleString()} tokens available
                    </p>
                  </div>
                )}

                {isComingSoon && (
                  <div className="px-5 pb-5">
                    <button className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all text-sm flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" /> Notify Me When Live
                    </button>
                  </div>
                )}

                {isSoldOut && (
                  <div className="px-5 pb-5">
                    <div className="w-full py-3.5 rounded-xl bg-white/10 text-center">
                      <p className="text-white/60 font-semibold text-sm flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" /> Fully Funded
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Trust badges */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                {[
                  { icon: Shield, text: 'Legally verified & audited', color: 'text-green-500' },
                  { icon: Building2, text: 'Regulated real estate investment', color: 'text-blue-500' },
                  { icon: CheckCircle, text: 'Smart contract secured', color: 'text-purple-500' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                    <span className="text-xs text-gray-600">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}