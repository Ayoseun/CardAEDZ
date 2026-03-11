// ─── Domain types (mirrored from Go domain/marketplace.go) ───────────────────

export type ListingStatus = 'active' | 'fully_sold' | 'completed' | 'cancelled' | 'pending';

export interface MarketListing {
  id: string;
  listingId: string;
  fccAmount: number;
  floorFccBid: number;
  listedFcc: number;
  price: number;
  dateTime: string;
  status: ListingStatus;
  totalValue: number;
  remaining: number;
  isOwn: boolean;
}

export interface UserFccActivity {
  fccBalance: number;
  totalFccsold: number;    // lowercase 's' confirmed from API
  earningsAedz: number;
  activeListings: number;
  totalFccListed: number;
  rewardTokens: number;
}

/** Mirrors Go PlatformStatsSummary */
export interface PlatformStats {
  totalFccBoughtByCity: number;
  totalAedzPaidToUsers: number;
  activeListingsCount: number;
  avgBuybackPrice30d: number;
  updatedAt: string;
}

export interface MarketDepthOrder {
  fccAmount: number;
  price: number;
  date: string;
  totalValue: number;
}

export interface MarketDepth {
  buyOrders: MarketDepthOrder[];
  sellOrders: MarketDepthOrder[];
}

/** Mirrors Go FCCTimelineEntrySummary */
export interface FCCTimelineEntry {
  eventType: string;
  label: string;
  detail: string;
  occurredAt: string;
}

/** Mirrors Go FCCListingDetailSummary */
export interface FCCListingDetail {
  listingId: string;
  listedFcc: number;
  soldFcc: number;
  remainingFcc: number;
  priceInAedz: number;
  totalValue: number;
  totalEarned: number;
  status: string;
  listedAt: string;
  cancelledAt?: string;
  saleProgressInPercentage: number;
  timeline: FCCTimelineEntry[];
}

// ─── Base fetcher ──────────────────────────────────────────────────────────────

async function apiFetch<T>(
  url: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message ?? `API error ${res.status}`);
  }
  return json;
}

// ─── Raw API shapes (from confirmed payloads) ──────────────────────────────────

/** POST /api/v1/marketplace/listings */
export interface CreateListingPayload {
  fcc_amount: number;
  price_aedz: number;
  aedz_address: string;  // confirmed required field
}

export interface ApiCreateListingResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    listingId: string;
    userId: string;
    priceInAedz: number;
    listedFcc: number;
    soldFcc: number;
    status: string;
    listedAt: string;
  };
}

/** GET /api/v1/marketplace/listings  (paginated list) */
export interface ApiListingsResponse {
  success: boolean;
  data: ApiListing[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiListing {
  listingId: string;
  userId: string;
  priceInAedz: number;
  listedFcc: number;
  soldFcc: number;
  remainingFcc?: number;
  totalValue?: number;
  status: string;
  listedAt: string;
  isOwn?: boolean;
}

/** GET /api/v1/marketplace/listings/my  (current user's listings) */
export type ApiMyListingsResponse = ApiListingsResponse;

/** GET /api/v1/marketplace/activity  (user FCC activity stats)
 *  Confirmed payload:
 *  { walletAddress, fccBalance, totalFccsold, earningsAedz,
 *    activeListings, totalFccListed, rewardTokens }
 */
export interface ApiActivityResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    walletAddress: string;
    fccBalance: number;   // FCC held in wallet (not listed)
    totalFccsold: number;   // camelCase — lowercase 's' confirmed
    earningsAedz: number;   // AEDZ earned from buybacks
    activeListings: number;   // listings with status=active
    totalFccListed: number;   // FCC across all active listings
    rewardTokens: number;
  };
}

/** GET /api/v1/marketplace/stats  — mirrors Go PlatformStatsSummary */
export interface ApiPlatformStatsResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    totalFccBoughtByCity: number;
    totalAedzPaidToUsers: number;
    activeListingsCount: number;
    avgBuybackPrice30d: number;
    updatedAt: string;
  };
}

/** GET /api/v1/marketplace/listings/:id  — mirrors Go GetFCCListingDetailResponse */
export interface ApiListingDetailResponse {
  statusCode: number;
  success: boolean;
  message: string;
  detail: FCCListingDetail;
}

/** GET /api/v1/marketplace/depth
 *  Confirmed payload: data is a flat array:
 *  [{ priceInAedz: 1.25, fccAmount: 6940, dateTime: "2026-...", totalValue: 8675 }]
 */
export interface ApiDepthOrder {
  priceInAedz: number;  // price per FCC in AEDZ
  fccAmount: number;  // FCC amount in this order
  dateTime: string;  // ISO 8601 with timezone offset
  totalValue: number;  // fccAmount * priceInAedz
}

export interface ApiMarketDepthResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: ApiDepthOrder[];   // flat array, not { buyOrders, sellOrders }
}

/** PATCH /api/v1/marketplace/listings/:id */
export interface EditListingPayload {
  fcc_amount?: number;
  price_aedz?: number;
}

/** DELETE /api/v1/marketplace/listings/:id */
export interface CancelListingResponse {
  success: boolean;
  message: string;
  data?: {
    returnedFcc: number;
    newFccBalance: number;
  };
}

// ─── Mappers ───────────────────────────────────────────────────────────────────

function mapListingStatus(raw: string): ListingStatus {
  const map: Record<string, ListingStatus> = {
    active: 'active',
    fully_sold: 'fully_sold',
    completed: 'completed',
    cancelled: 'cancelled',
    pending: 'pending',
  };
  return map[raw?.toLowerCase()] ?? 'pending';
}

function formatListingDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export function mapApiListing(api: ApiListing, currentUserId?: string): MarketListing {
  const listedFcc = api.listedFcc ?? 0;
  const soldFcc = api.soldFcc ?? 0;
  const remainingFcc = api.remainingFcc ?? (listedFcc - soldFcc);
  const price = api.priceInAedz ?? 0;
  const totalValue = api.totalValue ?? listedFcc * price;

  return {
    id: api.listingId,
    listingId: api.listingId,
    fccAmount: listedFcc,
    floorFccBid: listedFcc,
    listedFcc,
    price,
    dateTime: formatListingDate(api.listedAt),
    status: mapListingStatus(api.status),
    totalValue,
    remaining: remainingFcc,
    isOwn: api.isOwn ?? (currentUserId ? api.userId === currentUserId : false),
  };
}

function mapPlatformStats(data: ApiPlatformStatsResponse['data']): PlatformStats {
  return {
    totalFccBoughtByCity: data.totalFccBoughtByCity ?? 0,
    totalAedzPaidToUsers: data.totalAedzPaidToUsers ?? 0,
    activeListingsCount: data.activeListingsCount ?? 0,
    avgBuybackPrice30d: data.avgBuybackPrice30d ?? 0,
    updatedAt: data.updatedAt ?? '',
  };
}


function mapMarketDepth(data: ApiDepthOrder[]): MarketDepth {
  return {
    buyOrders: (data ?? []).map(o => ({
      fccAmount: o.fccAmount,
      price: o.priceInAedz,
      date: formatListingDate(o.dateTime),
      totalValue: o.totalValue,
    })),
    sellOrders: [],
  };
}

// ─── API calls ─────────────────────────────────────────────────────────────────

export async function createListing(
  payload: CreateListingPayload,
  accessToken: string,
  apiUrl: string,
): Promise<ApiCreateListingResponse['data']> {
  console.log('Creating listing with payload:', payload);
  const res = await apiFetch<ApiCreateListingResponse>(
    `http://${apiUrl}:3000/api/v1/marketplace/listings`,
    accessToken,
    { method: 'POST', body: JSON.stringify(payload) },
  );
  return res.data;
}

export async function fetchAllListings(params: {
  page?: number;
  limit?: number;
  status?: string;
  accessToken: string;
  apiUrl: string;
  userId?: string;
}): Promise<{ listings: MarketListing[]; totalPages: number; total: number }> {
  const { page = 1, limit = 10, status, accessToken, apiUrl, userId } = params;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) qs.set('status', status);
  const res = await apiFetch<ApiListingsResponse>(
    `http://${apiUrl}:3000/api/v1/marketplace/my-listings?${qs}`,
    accessToken,
  );
  return {
    listings: (res.data ?? []).map(l => mapApiListing({ ...l, isOwn: true }, userId)),
    totalPages: res.pagination?.total_pages ?? 1,
    total: res.pagination?.total ?? res.data?.length ?? 0,
  };
}

export async function fetchUserActivity(
  accessToken: string,
  apiUrl: string,
): Promise<UserFccActivity> {
  const res = await apiFetch<ApiActivityResponse>(
    `http://${apiUrl}:3000/api/v1/marketplace/activity`,
    accessToken,
  );
  return {
    fccBalance: res.data.fccBalance ?? 0,
    totalFccsold: res.data.totalFccsold ?? 0,
    earningsAedz: res.data.earningsAedz ?? 0,
    activeListings: res.data.activeListings ?? 0,
    totalFccListed: res.data.totalFccListed ?? 0,
    rewardTokens: res.data.rewardTokens ?? 0,
  };
}

export async function fetchPlatformStats(
  accessToken: string,
  apiUrl: string,
): Promise<PlatformStats> {
  const res = await apiFetch<ApiPlatformStatsResponse>(
    `http://${apiUrl}:3000/api/v1/marketplace/stats`,
    accessToken,
  );
  return mapPlatformStats(res.data);
}

export async function fetchMarketDepth(
  accessToken: string,
  apiUrl: string,
): Promise<MarketDepth> {
  const res = await apiFetch<ApiMarketDepthResponse>(
    `http://${apiUrl}:3000/api/v1/marketplace/depth`,
    accessToken,
  );
  return mapMarketDepth(res.data ?? []);
}

export async function editListing(
  listingId: string,
  payload: EditListingPayload,
  accessToken: string,
  apiUrl: string,
): Promise<void> {
  await apiFetch(
    `http://${apiUrl}:3000/api/v1/marketplace/listings/${listingId}`,
    accessToken,
    { method: 'PATCH', body: JSON.stringify(payload) },
  );
}

export async function cancelListing(
  listingId: string,
  accessToken: string,
  apiUrl: string,
): Promise<CancelListingResponse['data']> {
  const res = await apiFetch<CancelListingResponse>(
    `http://${apiUrl}:3000/api/v1/marketplace/listings/${listingId}`,
    accessToken,
    { method: 'DELETE' },
  );
  return res.data;
}

export async function fetchListingDetail(
  listingId: string,
  accessToken: string,
  apiUrl: string,
): Promise<FCCListingDetail> {
  const res = await apiFetch<ApiListingDetailResponse>(
    `http://${apiUrl}:3000/api/v1/marketplace/listings/${listingId}`,
    accessToken,
  );
  return res.detail;
}