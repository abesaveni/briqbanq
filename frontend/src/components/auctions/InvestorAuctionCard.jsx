import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder'
import { useNavigate } from "react-router-dom";
import useCountdown from "../../hooks/useCountdown";
import { formatCurrency } from "../../utils/formatters";
import { BedDouble, Bath, Car, Clock, Users, MapPin } from "lucide-react";

const STATUS_CONFIG = {
  live:     { label: "Live Now",  dot: true,  cls: "bg-red-500 text-white" },
  upcoming: { label: "Upcoming",  dot: false, cls: "bg-blue-500 text-white" },
  ended:    { label: "Ended",     dot: false, cls: "bg-slate-400 text-white" },
  paused:   { label: "Paused",    dot: false, cls: "bg-amber-500 text-white" },
  active:   { label: "Active",    dot: false, cls: "bg-indigo-500 text-white" },
  "buy-now":{ label: "Buy Now",   dot: false, cls: "bg-green-500 text-white" },
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

  return (
    <div
      onClick={() => navigate(dest)}
      className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative h-36 flex-shrink-0">
        <img
          src={auction.image || PROPERTY_PLACEHOLDER}
          alt={auction.title || "Property"}
          className="w-full h-full object-cover"
        />

        {/* Status badge */}
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.cls}`}>
          {cfg.dot && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
          {cfg.label}
        </span>

        {/* Countdown */}
        {isLive && auction.endTime && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock size={10} />
            {timeLeft.formatted || "Live"}
          </span>
        )}

        {/* Bed/Bath/Parking */}
        {(auction.bedrooms > 0 || auction.bathrooms > 0 || auction.parking > 0) && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {auction.bedrooms > 0 && (
              <span className="bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <BedDouble size={10} />{auction.bedrooms}
              </span>
            )}
            {auction.bathrooms > 0 && (
              <span className="bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Bath size={10} />{auction.bathrooms}
              </span>
            )}
            {auction.parking > 0 && (
              <span className="bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Car size={10} />{auction.parking}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1 gap-2">

        {/* Title + location */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">
            {auction.title || "Investment Property"}
          </h3>
          {location && (
            <p className="text-[11px] text-slate-400 flex items-center gap-0.5 mt-0.5">
              <MapPin size={10} className="flex-shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          )}
        </div>

        {/* Key stats grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] border-t border-slate-100 pt-2">
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Debt</p>
            <p className="font-bold text-slate-800">{formatCurrency(auction.outstandingDebt)}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Value</p>
            <p className="font-bold text-slate-800">{formatCurrency(auction.propertyValue)}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">LVR</p>
            <p className="font-bold text-indigo-600">{auction.lvr || 0}%</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Return</p>
            <p className="font-bold text-green-600">{auction.returnRate || 0}%</p>
          </div>
        </div>

        {/* Current bid or equity */}
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5 text-[11px]">
          {auction.currentBid > 0 ? (
            <>
              <span className="text-slate-500">Current Bid</span>
              <span className="font-bold text-green-600">{formatCurrency(auction.currentBid)}</span>
            </>
          ) : (
            <>
              <span className="text-slate-500">Equity</span>
              <span className="font-bold text-slate-800">{formatCurrency(auction.equity)}</span>
            </>
          )}
          {auction.bidders > 0 && (
            <span className="flex items-center gap-1 text-slate-400">
              <Users size={10} />{auction.bidders}
            </span>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate(dest); }}
          className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all mt-auto ${
            isLive
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : isBuyNow
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "border border-slate-200 hover:bg-slate-50 text-slate-700"
          }`}
        >
          {isLive ? "Place Bid" : isBuyNow ? "Buy Now" : "View Details"}
        </button>
      </div>
    </div>
  );
}
