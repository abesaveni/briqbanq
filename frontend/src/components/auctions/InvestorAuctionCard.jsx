import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder';
import { useNavigate } from "react-router-dom";
import useCountdown from "../../hooks/useCountdown";
import { formatCurrency } from "../../utils/formatters";
import { BedDouble, Bath, Car, Clock, Users, MapPin } from "lucide-react";

const STATUS_CONFIG = {
  live:      { label: "Live Now",  dot: true,  cls: "bg-red-500 text-white" },
  upcoming:  { label: "Upcoming",  dot: false, cls: "bg-blue-500 text-white" },
  ended:     { label: "Ended",     dot: false, cls: "bg-slate-400 text-white" },
  paused:    { label: "Paused",    dot: false, cls: "bg-amber-500 text-white" },
  active:    { label: "Active",    dot: false, cls: "bg-indigo-500 text-white" },
  "buy-now": { label: "Buy Now",   dot: false, cls: "bg-emerald-500 text-white" },
};

export default function InvestorAuctionCard({ auction }) {
  const navigate = useNavigate();
  if (!auction) return null;

  const isLive = auction.status === "live";
  const isBuyNow = auction.status === "buy-now";
  const timeLeft = useCountdown(auction.endTime);
  const cfg = STATUS_CONFIG[auction.status] || STATUS_CONFIG.active;

  const dest = isBuyNow
    ? `/investor/buy-now/${auction.id}`
    : `/investor/auctions/${auction.id}`;

  const location = [auction.suburb, auction.state, auction.postcode]
    .filter(Boolean).join(", ");

  const specs = [
    auction.bedrooms > 0 && { icon: BedDouble, val: auction.bedrooms, label: "Beds" },
    auction.bathrooms > 0 && { icon: Bath, val: auction.bathrooms, label: "Baths" },
    auction.parking > 0 && { icon: Car, val: auction.parking, label: "Parking" },
  ].filter(Boolean);

  return (
    <div
      onClick={() => navigate(dest)}
      className="bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group"
    >
      {/* Image */}
      <div className="relative h-48 flex-shrink-0 overflow-hidden">
        <img
          src={auction.image || PROPERTY_PLACEHOLDER}
          alt={auction.title || "Property"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Status badge */}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
          {cfg.dot && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
          {cfg.label}
        </span>

        {/* Countdown */}
        {isLive && auction.endTime && (
          <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Clock size={11} />
            {timeLeft.formatted || "Live"}
          </span>
        )}

        {/* Specs overlay */}
        {specs.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {specs.map(({ icon: Icon, val, label }) => (
              <span key={label} className="bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                <Icon size={11} />{val}
              </span>
            ))}
          </div>
        )}

        {/* Bidder count */}
        {auction.bidders > 0 && (
          <span className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
            <Users size={11} />{auction.bidders}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">

        {/* Title + location */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-1">
            {auction.title || "Investment Property"}
          </h3>
          {location && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <MapPin size={11} className="flex-shrink-0 text-gray-400" />
              <span className="truncate">{location}</span>
            </p>
          )}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-3 border-y border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Outstanding Debt</p>
            <p className="text-sm font-semibold text-gray-900">{formatCurrency(auction.outstandingDebt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Property Value</p>
            <p className="text-sm font-semibold text-gray-900">{formatCurrency(auction.propertyValue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">LVR</p>
            <p className="text-sm font-semibold text-indigo-600">{auction.lvr || 0}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Return Rate</p>
            <p className="text-sm font-semibold text-emerald-600">{auction.returnRate || 0}%</p>
          </div>
        </div>

        {/* Current bid or equity */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{auction.currentBid > 0 ? "Current Bid" : "Equity"}</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(auction.currentBid > 0 ? auction.currentBid : auction.equity)}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(dest); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              isLive
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : isBuyNow
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "border border-gray-200 hover:bg-gray-50 text-gray-700"
            }`}
          >
            {isLive ? "Place Bid" : isBuyNow ? "Buy Now" : "View Details"}
          </button>
        </div>
      </div>
    </div>
  );
}
