import { FUTURE_CITY_API_URL } from '../../constants/config';
import type { Property, PropertyStatus, OccupancyStatus } from '../types';

// ─── Raw API shape ─────────────────────────────────────────────────────────────

export interface ApiProperty {
  id: string;
  name: string;
  description?: string;
  property_type?: string;       // "Residential" | "Commercial"
  status?: string;              // "active" | "almost_funded" | "coming_soon" | "funding_completed"
  occupancy_status?: string;    // "rented" | "vacant"
  city?: string;
  country?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  cover_image?: string;

  // Financials
  total_value?: number;
  funding_goal?: number;
  funding_raised?: number;
  funding_percentage?: number;
  min_investment?: number;
  price_per_token?: number;
  expected_roi?: number;
  rental_yield?: number;
  total_tokens?: number;
  available_tokens?: number;

  // Specs
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;

  // Extras
  highlights?: string[];
  documents?: { name: string; url: string }[];
}

export interface ApiPropertiesResponse {
  status_code: number;
  success: boolean;
  message?: string;
  properties: ApiProperty[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };

}
export interface ApiPropertyResponse {
  status_code: number;
  success: boolean;
  message?: string;
  property: ApiProperty;
  error?: string;

}
// ─── Status mapper ────────────────────────────────────────────────────────────

function mapStatus(raw?: string): PropertyStatus {
  const map: Record<string, PropertyStatus> = {
    active: 'active',
    open: 'active',
    almost_funded: 'almost_funded',
    coming_soon: 'coming_soon',
    funding_completed: 'funding_completed',
    funded: 'funding_completed',
    closed: 'funding_completed',
  };
  return map[raw?.toLowerCase() ?? ''] ?? 'active';
}

function mapOccupancy(raw?: string): OccupancyStatus | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower === 'rented' || lower === 'occupied') return 'rented';
  if (lower === 'vacant' || lower === 'empty') return 'vacant';
  return undefined;
}

// ─── Main mapper ──────────────────────────────────────────────────────────────

export function mapApiProperty(api: ApiProperty): Property {
  const fundingGoal = api.funding_goal ?? api.total_value ?? 0;
  const fundingRaised = api.funding_raised ?? 0;
  const fundingPercent = api.funding_percentage != null
    ? Math.round(api.funding_percentage)
    : fundingGoal > 0
      ? Math.round((fundingRaised / fundingGoal) * 100)
      : 0;

  const location = api.location
    ?? [api.city, api.country].filter(Boolean).join(', ')
    ?? 'Unknown Location';

  const imageUrl = api.images?.[0] ?? api.cover_image ?? '';

  return {
    id: api.id,
    name: api.name,
    location,
    country: api.country ?? '',
    cover_image: api.cover_image!!,
    images: api.images?.length ? api.images : imageUrl ? [imageUrl] : [],
    status: mapStatus(api.status),
    occupancy: mapOccupancy(api.occupancy_status),
    totalValue: api.total_value ?? 0,
    fundingGoal,
    fundingRaised,
    fundingPercent,
    minInvestment: api.min_investment,
    pricePerToken: api.price_per_token ?? 0,
    expectedReturn: api.expected_roi ?? 0,
    annualYield: api.rental_yield ?? 0,
    propertyType: api.property_type ?? 'Residential',
    bedrooms: api.bedrooms,
    bathrooms: api.bathrooms,
    sqft: api.area_sqm,
    availableTokens: api.available_tokens ?? 0,
    totalTokens: api.total_tokens ?? 0,
    description: api.description ?? '',
    highlights: api.highlights ?? [],
    documents: api.documents ?? [],
    latitude: api.latitude,
    longitude: api.longitude,
  };
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface FetchPropertiesParams {
  page?: number;
  limit?: number;
  status?: string | null;
  type?: string | null;
  query?: string | null;
  accessToken: string;
  apiUrl: string;
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

export async function fetchProperties(params: FetchPropertiesParams): Promise<{
  properties: Property[];
  totalPages: number;
  total: number;
}> {
  const {
    page = 1,
    limit = 12,
    status,
    type,
    query,
    accessToken
  } = params;

  // Build query string only with provided filters (omit null/undefined)
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  if (status && status !== 'null') qs.set('status', status);
  if (type && type !== 'null') qs.set('type', type);
  if (query && query !== 'null') qs.set('query', query);
  // Add other filters if your API supports them (e.g., city, country, price range)

  const url = `http://localhost:3000/api/v1/properties`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Properties API error: ${response.status} ${response.statusText}`);
  }

  const result: ApiPropertiesResponse = await response.json();

  if (!result.success) {
    throw new Error(result.message ?? 'Failed to fetch properties');
  }
  console.log('Raw API response:', result);
  return {
    properties: (result.properties ?? []).map(mapApiProperty),
    totalPages: result.pagination?.total_pages ?? 1,
    total: result.pagination?.total ?? (result.properties?.length ?? 0),
  };
}

// ─── Single property fetcher (new) ───────────────────────────────────────────

export async function fetchPropertyById(
  id: string,
  accessToken: string,
): Promise<Property> {
  const url = `http://${FUTURE_CITY_API_URL}:3000/api/v1/properties/${id}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Property API error: ${response.status} ${response.statusText}`);
  }

  const result: ApiPropertyResponse = await response.json();

  if (!result.success || !result.property) {
    throw new Error(result.message ?? 'Failed to fetch property');
  }

  return mapApiProperty(result.property);
}