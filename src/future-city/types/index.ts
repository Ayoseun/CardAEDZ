// ─── Auth & User ──────────────────────────────────────────────────────────────

export interface User {
  email?: string;
  accessToken?: string;
  userId?: string;
}

// ─── Wallet & Balances ────────────────────────────────────────────────────────

export interface Balances {
  wallet: string;
  AEDZ: string;
  fcv: string;
  fcc: string;
}

export interface Addresses {
  fcvAtaAddress: string;
  fccAtaAddress: string;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface ApiTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  fee: number;
  balance_before: number;
  balance_after: number;
  recipient_wallet_id?: string;
  description: string;
  created_at: string;
  updated_at: string;
  tx_hash?: string;
}

export interface Transaction {
  id: string;
  type: 'convert' | 'convert_from' | 'send' | 'receive' | 'reward' | 'sell' | 'investment' | 'listed' | 'cancelled';
  title: string;
  description: string;
  amount: string;
  token: 'FCV' | 'FCC' | 'AEDZ';
  equivalentAmount?: string;
  equivalentToken?: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  time: string;
  txId?: string;
  txHash?: string;
  recipientWalletId?: string;
  propertyName?: string;
  rawAmount: number;
  fee: number;
  balanceBefore: number;
  balanceAfter: number;
  apiType: string;
}

// ─── Properties ───────────────────────────────────────────────────────────────

// Matches screenshot statuses: Open | Almost Funded | Coming Soon | Funded
export type PropertyStatus = 'active' | 'almost_funded' | 'coming_soon' | 'funding_completed';

// Occupancy status shown as chip in specs row
export type OccupancyStatus = 'rented' | 'vacant';

export type InvestmentStatus = 'pre_cooloff' | 'post_cooloff';



export interface Property {
  id: string;
  name: string;
  location: string;
  country: string;
  cover_image: string;          // primary image URL
  images: string[];              // all image URLs
  status: PropertyStatus;
  occupancy?: OccupancyStatus;
  totalValue: number;
  fundingGoal: number;
  fundingRaised: number;
  fundingPercent: number;
  minInvestment?: number;
  pricePerToken: number;
  expectedReturn: number;        // annual ROI %
  annualYield: number;            // rental yield %
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;                  // area in square metres (as displayed)
  availableTokens: number;
  totalTokens: number;
  description: string;
  highlights: string[];
  documents: Array<{ name: string; url: string }>;
  latitude?: number;
  longitude?: number;
}

export interface Investment {
  id: string;
  propertyId: string;
  property: Property;
  tokensOwned: number;
  investedAmount: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  purchaseDate: string;
  status: InvestmentStatus;
  cooloffDeadline?: string;
  rewardEarned: number;
}

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
  fccPricePerAedz: number;
  totalValue: number;
  totalEarned: number;
  status: string;
  listedAt: string;
  cancelledAt?: string;
  saleProgressInPercentage: number;
  timeline: FCCTimelineEntry[];
}
