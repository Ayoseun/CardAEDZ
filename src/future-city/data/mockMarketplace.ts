import { MarketListing, MarketDepth, PlatformStats, UserFccActivity } from '../types/marketplace';

export const MOCK_USER_ACTIVITY: UserFccActivity = {
  fccBound: 7200,
  totalFccSale: 8450,
  revenueFromSales: 19012,
  activeListings: 5,
};

export const MOCK_PLATFORM_STATS: PlatformStats = {
  lowestFccToBound: { amount: 8000,       price: 2.10, date: '03/01/2025 14:30' },
  fromFccToBound:   { amount: 1500,       price: 0.20, date: '03/01/2025 14:30' },
  activeListing:    { total: 4230,        price: 2.30, date: '03/01/2025 14:30' },
  allTimeLowBuybackPrice: { amount: 400,  price: 2.40, date: '03/01/2025 14:30', totalValue: 960 },
};

export const MOCK_MARKET_DEPTH: MarketDepth = {
  buyOrders: [
    { fccAmount: 3000, price: 2.10, date: '03/01/2025 14:30', totalValue: 6300 },
    { fccAmount: 1500, price: 0.20, date: '03/01/2025 14:30', totalValue: 300  },
    { fccAmount: 900,  price: 2.30, date: '03/01/2025 14:30', totalValue: 2070 },
    { fccAmount: 400,  price: 2.40, date: '03/01/2025 14:30', totalValue: 960  },
  ],
  sellOrders: [],
};

export const MOCK_MY_LISTINGS: MarketListing[] = [
  { id: 'L-102', listingId: 'L-102', fccAmount: 0.25, floorFccBid: 100, listedFcc: 100, price: 1,    dateTime: '03/03/2025 04:58', status: 'active',     totalValue: 100,  isOwn: true },
  { id: 'L-098', listingId: 'L-098', fccAmount: 0.25, floorFccBid: 300, listedFcc: 300, price: 1,    dateTime: '03/03/2025 04:58', status: 'active',     totalValue: 300,  isOwn: true },
  { id: 'L-081', listingId: 'L-081', fccAmount: 0.25, floorFccBid: 42,  listedFcc: 42,  price: 1,    dateTime: '03/05/2025 03:56', status: 'active',     totalValue: 42,   isOwn: true },
  { id: 'L-08',  listingId: 'L-08',  fccAmount: 0.25, floorFccBid: 80,  listedFcc: 80,  price: 1,    dateTime: '06/04/2025 06:05', status: 'active',     totalValue: 80,   isOwn: true },
  { id: 'L-085', listingId: 'L-085', fccAmount: 0.25, floorFccBid: 160, listedFcc: 160, price: 1,    dateTime: '04/5/2025 06:05',  status: 'fully_sold', totalValue: 160,  isOwn: true },
  { id: 'L-052', listingId: 'L-052', fccAmount: 0.25, floorFccBid: 300, listedFcc: 300, price: 1,    dateTime: '08/9/2025 09:09',  status: 'active',     totalValue: 300,  isOwn: true },
];

export const MOCK_ALL_LISTINGS: MarketListing[] = [
  { id: 'L-102', listingId: 'L-102', fccAmount: 100,  floorFccBid: 100,  listedFcc: 100,  price: 3.30, dateTime: '03/03/2025 04:58', status: 'active',     totalValue: 330,   isOwn: true  },
  { id: 'L-098', listingId: 'L-098', fccAmount: 300,  floorFccBid: 300,  listedFcc: 300,  price: 3.50, dateTime: '03/03/2025 04:58', status: 'fully_sold', totalValue: 1050,  isOwn: false },
  { id: 'L-081', listingId: 'L-081', fccAmount: 42,   floorFccBid: 42,   listedFcc: 42,   price: 1.00, dateTime: '03/05/2025 03:56', status: 'active',     totalValue: 42,    isOwn: false },
  { id: 'L-08',  listingId: 'L-08',  fccAmount: 80,   floorFccBid: 80,   listedFcc: 80,   price: 1.00, dateTime: '06/04/2025 06:05', status: 'active',     totalValue: 80,    isOwn: true  },
  { id: 'L-085', listingId: 'L-085', fccAmount: 160,  floorFccBid: 160,  listedFcc: 160,  price: 1.00, dateTime: '04/5/2025 06:05',  status: 'fully_sold', totalValue: 160,   isOwn: false },
  { id: 'L-052', listingId: 'L-052', fccAmount: 300,  floorFccBid: 300,  listedFcc: 300,  price: 1.00, dateTime: '08/9/2025 09:09',  status: 'active',     totalValue: 300,   isOwn: false },
];
