import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder'
import { Eye, Gavel, ShoppingCart, Clock, Bed, Bath, Car, MapPin } from "lucide-react";
import useCountdown from "../../hooks/useCountdown";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";

const STATUS_CONFIG = {
  "Live Auction": { cls: "bg-red-500 text-white", dot: true },
  "Coming Soon":  { cls: "bg-blue-500 text-white", dot: false },
  "Buy Now":      { cls: "bg-green-500 text-white", dot: false },
  "Active":       { cls: "bg-green-500 text-white", dot: false },
  "Sold":         { cls: "bg-slate-700 text-white", dot: false },
};

export default function InvestorDealCard({ deal, viewMode = "grid" }) {
  const countdown = useCountdown(deal?.auctionEnd || null);
  const navigate = useNavigate();
  if (!deal) return null;

  const cfg = STATUS_CONFIG[deal.status] || { cls: "bg-slate-400 text-white", dot: false };
  const isLive = deal.status === "Live Auction";
  const isBuyNow = deal.status === "Buy Now" || deal.status === "Active";
  const dest = isBuyNow ? `/investor/buy-now/${deal.id}` : `/investor/auctions/${deal.id}`;
  const location = [deal.suburb, deal.state, deal.postcode].filter(Boolean).join(", ");

  if (viewMode === "list") {
    return (
      <div
        onClick={() => navigate(dest)}
        className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer p-3 flex items-center gap-4"
      >
        <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img src={deal.image || PROPERTY_PLACEHOLDER} alt={deal.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">{deal.title}</h3>
              <p className="text-[11px] text-slate-400 truncate">{location}</p>
            </div>
            <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${cfg.cls}`}>
              {cfg.dot && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
              {deal.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="text-[11px] text-slate-500">Loan <span className="font-bold text-slate-800">{formatCurrency(deal.loanAmount)}</span></span>
            <span className="text-[11px] text-indigo-600 font-bold">LVR {deal.lvr}%</span>
            <span className="text-[11px] text-green-600 font-bold">Return {deal.returnRate}%</span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(dest); }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${isLive ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-700"}`}
        >
          {isLive ? "Bid" : "View"}
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(dest)}
      className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative h-36 flex-shrink-0">
        <img src={deal.image || PROPERTY_PLACEHOLDER} alt={deal.title} className="w-full h-full object-cover" />
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.cls}`}>
          {cfg.dot && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
          {deal.status === "Live Auction" ? "Live" : deal.status}
        </span>
        {isLive && countdown?.formatted && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock size={10} />{countdown.formatted}
          </span>
        )}
        {(deal.bedrooms > 0 || deal.bathrooms > 0 || deal.parking > 0) && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {deal.bedrooms > 0 && <span className="bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"><Bed size={10} />{deal.bedrooms}</span>}
            {deal.bathrooms > 0 && <span className="bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"><Bath size={10} />{deal.bathrooms}</span>}
            {deal.parking > 0 && <span className="bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"><Car size={10} />{deal.parking}</span>}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">{deal.title}</h3>
          {location && (
            <p className="text-[11px] text-slate-400 flex items-center gap-0.5 mt-0.5">
              <MapPin size={10} className="flex-shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] border-t border-slate-100 pt-2">
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Loan</p>
            <p className="font-bold text-slate-800">{formatCurrency(deal.loanAmount)}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">{isLive ? "Current Bid" : "Value"}</p>
            <p className={`font-bold ${isLive ? "text-green-600" : "text-slate-800"}`}>
              {isLive ? formatCurrency(deal.currentBid) : formatCurrency(deal.estimatedValue || deal.loanAmount)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">LVR</p>
            <p className="font-bold text-indigo-600">{deal.lvr}%</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Return</p>
            <p className="font-bold text-green-600">{deal.returnRate}%</p>
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          {isLive ? (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/investor/auctions/${deal.id}`); }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Gavel size={12} />Place Bid
            </button>
          ) : isBuyNow ? (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/investor/buy-now/${deal.id}`); }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <ShoppingCart size={12} />Buy Now
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(dest); }}
              className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Eye size={12} />View
            </button>
          )}
          {isLive && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/investor/auctions/${deal.id}`); }}
              className="border border-slate-200 hover:bg-slate-50 text-slate-500 px-2 py-1.5 rounded-lg"
            >
              <Eye size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
