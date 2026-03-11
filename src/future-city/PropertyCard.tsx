import { useState } from 'react';
import { MapPin, Heart, Bed, Bath, Maximize, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import type { Property } from './types';

interface PropertyCardProps {
  property: Property;
  onClick: (property: Property) => void;
}

const STATUS_BADGE: Record<string, { label: string; textClass: string; borderClass: string }> = {
  active:            { label: 'Open',          textClass: 'text-green-500',  borderClass: 'border-green-400'  },
  almost_funded:     { label: 'Almost Funded', textClass: 'text-orange-500', borderClass: 'border-orange-400' },
  coming_soon:       { label: 'Coming Soon',   textClass: 'text-purple-500', borderClass: 'border-purple-400' },
  funding_completed: { label: 'Funded',        textClass: 'text-blue-500',   borderClass: 'border-blue-400'   },
};

function formatFCV(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M FCV`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K FCV`;
  return `${value} FCV`;
}

export default function PropertyCard({ property, onClick }: PropertyCardProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const images = property.images?.length ? property.images : [property.cover_image];
  const badge = STATUS_BADGE[property.status] ?? STATUS_BADGE['active'];

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((i) => (i - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIdx((i) => (i + 1) % images.length);
  };

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col"
      onClick={() => onClick(property)}
    >
      {/* ── Carousel ─────────────────────────────────────────────────────────── */}
      <div className="relative h-44 overflow-hidden bg-gray-100 flex-shrink-0">
        <img
           //@ts-ignore
          src={images[imgIdx].url}
          alt={property.name}
          className="w-full h-full object-cover"
        />

        {/* Property type chip — top left, dark pill */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white backdrop-blur-sm text-black text-[11px] font-semibold">
          {property.propertyType}
        </div>

        {/* Status badge — top right, outlined */}
        <div className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full border bg-white/90 backdrop-blur-sm text-[11px] font-bold ${badge.textClass} ${badge.borderClass}`}>
          {badge.label}
        </div>

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center shadow hover:bg-white transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                className={`h-1.5 rounded-full transition-all ${i === imgIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/55'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">

        {/* Title row + heart */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 text-[15px] leading-snug">{property.name}</h3>
          <button
            onClick={(e) => { e.stopPropagation(); setLiked((v) => !v); }}
            className="mt-0.5 flex-shrink-0"
          >
            <Heart className={`w-5 h-5 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
          </button>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-400 text-xs -mt-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{property.location}</span>
        </div>

        {/* Specs + occupancy */}
        <div className="flex items-center gap-3 text-gray-500 text-xs">
          {property.bedrooms !== undefined && (
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.bedrooms}</span>
          )}
          {property.bathrooms !== undefined && (
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms}</span>
          )}
          {property.sqft && (
            <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" />{property.sqft}sqm</span>
          )}
          {property.occupancy && (
            <span className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
              property.occupancy === 'rented'
                ? 'text-green-600 bg-green-50 border border-green-200'
                : 'text-amber-500 bg-amber-50 border border-amber-200'
            }`}>
              {property.occupancy === 'rented' && <CheckCircle className="w-3 h-3" />}
              {property.occupancy === 'rented' ? 'Rented' : 'Vacant'}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Funding progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-500">Funding Progress</span>
            <span className="font-semibold text-gray-700">{property.fundingPercent}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
              style={{ width: `${Math.min(property.fundingPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Target Raise / Min. Investment */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">Target Raise</p>
            <p className="text-sm font-bold text-gray-900">{formatFCV(property.fundingGoal)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">Min. Investment</p>
            <p className="text-sm font-bold text-gray-900">
              {property.minInvestment ? formatFCV(property.minInvestment) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Expected ROI / Rental Yield */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">Expected ROI</p>
            <p className="text-sm font-bold text-purple-600">{property.expectedReturn}%</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">Rental Yield</p>
            <p className="text-sm font-bold text-green-500">{property.annualYield}%</p>
          </div>
        </div>

        {/* View Details CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); onClick(property); }}
          className="mt-auto w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all"
        >
          View Details
        </button>
      </div>
    </div>
  );
}