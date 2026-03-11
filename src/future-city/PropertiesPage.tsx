import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, SlidersHorizontal, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Building2 } from 'lucide-react';
import { Property, PropertyStatus } from './types';
import PropertyCard from './PropertyCard';
import PropertyDetailPage from './PropertyDetailPage';
import CheckoutPage from './CheckoutPage';
import { fetchProperties } from './utils/properties';

interface PropertiesPageProps {
  fcvBalance: string;
  accessToken: string;
  apiUrl: string;
  onInvest: (propertyId: string, amount: number) => Promise<void>;
  onGoToInvestments: () => void;
}

type FilterTab = 'all' | PropertyStatus;
type View = 'list' | 'detail' | 'checkout';

const FILTER_TABS: { label: string; value: FilterTab; apiValue: string | null }[] = [
  { label: 'All', value: 'all', apiValue: null },
  { label: 'Open', value: 'active', apiValue: 'active' },
  { label: 'Almost Funded', value: 'almost_funded', apiValue: 'almost_funded' },
  { label: 'Coming Soon', value: 'coming_soon', apiValue: 'coming_soon' },
  { label: 'Funded', value: 'funding_completed', apiValue: 'funding_completed' },
];

const TYPE_OPTIONS: { label: string; apiValue: string | null }[] = [
  { label: 'All Types', apiValue: null },
  { label: 'Residential', apiValue: 'Residential' },
  { label: 'Commercial', apiValue: 'Commercial' },
];

const PAGE_SIZE = 12;

export default function PropertiesPage({
  fcvBalance,
  accessToken,
  apiUrl,
  onInvest,
  onGoToInvestments,
}: PropertiesPageProps) {
  // ── Navigation state ──────────────────────────────────────────────────────
  const [view, setView] = useState<View>('list');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [checkoutTokens, setCheckoutTokens] = useState(1);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<FilterTab>('all');
  const [typeFilter, setTypeFilter] = useState<{ label: string; apiValue: string | null }>(TYPE_OPTIONS[0]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data state ────────────────────────────────────────────────────────────
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Debounce search input ─────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // ── Fetch from API ────────────────────────────────────────────────────────
  const loadProperties = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const statusTab = FILTER_TABS.find((t) => t.value === statusFilter);
      const result = await fetchProperties({
        page,
        limit: PAGE_SIZE,
        status: statusTab?.apiValue ?? null,
        type: typeFilter.apiValue,
        query: debouncedSearch || null,
        accessToken,
        apiUrl,
      });

      setProperties(result.properties);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load properties');
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, apiUrl, page, statusFilter, typeFilter, debouncedSearch]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [statusFilter, typeFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleViewDetail = (property: Property) => {
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

  // ── Sub-pages ─────────────────────────────────────────────────────────────
  if (view === 'detail' && selectedProperty) {
    return (
      <PropertyDetailPage
        propertyId={selectedProperty.id}
        accessToken={accessToken}
        apiUrl={apiUrl}
        fcvBalance={fcvBalance}
        onBack={() => setView('list')}
        onCheckout={handleCheckout}
      />
    );
  }

  if (view === 'checkout' && selectedProperty) {
    return (
      <CheckoutPage
        property={selectedProperty}
        initialTokens={checkoutTokens}
        fcvBalance={fcvBalance}
        onBack={() => setView('detail')}
        onConfirm={onInvest}
        onSuccess={() => { setView('list'); onGoToInvestments(); }}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Search + filter bar ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or location…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>

          {/* Type filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={typeFilter.label}
              onChange={(e) => {
                const opt = TYPE_OPTIONS.find((o) => o.label === e.target.value) ?? TYPE_OPTIONS[0];
                setTypeFilter(opt);
                setPage(1);
              }}
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none bg-white cursor-pointer"
            >
              {TYPE_OPTIONS.map((t) => <option key={t.label}>{t.label}</option>)}
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={loadProperties}
            disabled={isLoading}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${statusFilter === value
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ────────────────────────────────────────────────────── */}
      {!isLoading && !error && (
        <p className="text-sm text-gray-500 px-1">
          Showing <span className="font-semibold text-gray-800">{properties.length}</span> of{' '}
          <span className="font-semibold text-gray-800">{total}</span> propert{total === 1 ? 'y' : 'ies'}
        </p>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                <div className="h-2 bg-gray-100 rounded-full w-full" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 bg-gray-100 rounded-xl" />
                  <div className="h-8 bg-gray-100 rounded-xl" />
                </div>
                <div className="h-10 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error state ──────────────────────────────────────────────────────── */}
      {!isLoading && error && (
        <div className="bg-white rounded-2xl border border-red-100 p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
          <p className="text-red-500 font-medium mb-1">Failed to load properties</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={loadProperties}
            className="px-5 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-700 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────────── */}
      {!isLoading && !error && properties.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No properties found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search term</p>
        </div>
      )}

      {/* ── Property grid ────────────────────────────────────────────────────── */}
      {!isLoading && !error && properties.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={handleViewDetail}
              />
            ))}
          </div>

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '…' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${page === p
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}