import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder'
import { Eye, Gavel, Bed, Bath, Car, Clock, Zap, MapPin } from "lucide-react";
import useCountdown from "../../hooks/useCountdown";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";
import { useState } from "react";
import { dealsService } from "../../api/dataService";

const STATUS_CONFIG = {
  "Under Contract": { cls: "bg-red-500 text-white",    dot: false },
  "Listed":         { cls: "bg-indigo-500 text-white", dot: false },
  "Draft":          { cls: "bg-slate-400 text-white",  dot: false },
  "Draft (In Auction)": { cls: "bg-orange-500 text-white", dot: false },
  "Draft (Listed)": { cls: "bg-amber-500 text-white",  dot: false },
  "Live Auction":   { cls: "bg-red-500 text-white",    dot: true  },
  "Coming Soon":    { cls: "bg-blue-500 text-white",   dot: false },
  "Paused":         { cls: "bg-slate-400 text-white",  dot: false },
  "Ended":          { cls: "bg-slate-500 text-white",  dot: false },
  "Settled":        { cls: "bg-emerald-600 text-white",dot: false },
  "Closed":         { cls: "bg-slate-700 text-white",  dot: false },
  "Sold":           { cls: "bg-slate-800 text-white",  dot: false },
};

export default function AdminDealCard({ deal, onRefresh }) {
  const countdown = useCountdown(deal?.auctionEnd || null);
  const navigate = useNavigate();
  const [listing, setListing] = useState(false);
  const [imgError, setImgError] = useState(false);
  if (!deal) return null;

  const isDraft = deal.dealStatus === 'DRAFT';
  const isLive = deal.status === "Live Auction" || deal.status === "Under Contract";
  const cfg = STATUS_CONFIG[deal.status] || { cls: "bg-slate-400 text-white", dot: false };
  const location = [deal.suburb, deal.state, deal.postcode].filter(Boolean).join(", ");

  const handleListDeal = async (e) => {
    e.stopPropagation();
    if (!window.confirm('List this deal? It will become visible to investors.')) return;
    setListing(true);
    try {
      const res = await dealsService.listDeal(deal.id);
      if (res.success && onRefresh) onRefresh();
    } catch { /* ignore */ }
    finally { setListing(false); }
  };

  return (
    <div
      onClick={() => navigate(`/admin/case-details/${deal.case_id || deal.id}`)}
      className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative h-36 flex-shrink-0">
        <img
          src={(!imgError && deal.image) ? deal.image : PROPERTY_PLACEHOLDER}
          alt={deal.title}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
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
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">{isLive ? "Bid" : "Type"}</p>
            <p className={`font-bold ${isLive ? "text-green-600" : "text-slate-800"}`}>
              {isLive ? formatCurrency(deal.currentBid) : (deal.type || "—")}
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

        {isDraft && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 text-[11px]">
            <span className="flex items-center gap-1 text-amber-700 font-bold"><Zap size={10} />Action needed</span>
            <span className="text-amber-600">List to activate</span>
          </div>
        )}

        <div className="flex gap-2 mt-auto">
          {isLive ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/admin/buy-now/${deal.id}`); }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Gavel size={12} />Auction
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/admin/buy-now/${deal.id}`); }}
                className="border border-slate-200 hover:bg-slate-50 text-slate-500 px-2 py-1.5 rounded-lg"
              >
                <Eye size={14} />
              </button>
            </>
          ) : (
            <div className="flex gap-2 w-full">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/admin/case-details/${deal.case_id || deal.id}`); }}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Eye size={12} />View Case
              </button>
              {isDraft && (
                <button
                  onClick={handleListDeal}
                  disabled={listing}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Zap size={12} />{listing ? 'Listing…' : 'List'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
