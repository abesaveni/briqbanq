import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder'
import { useNavigate } from "react-router-dom";
import useCountdown from "../../hooks/useCountdown";
import { Clock, MapPin } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export default function InvestorEndingSoonCard({ auction }) {
  const navigate = useNavigate();
  const timeLeft = useCountdown(auction?.endTime);
  if (!auction) return null;

  return (
    <div
      onClick={() => auction.id && navigate(`/investor/auctions/${auction.id}`)}
      className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative h-36 flex-shrink-0">
        <img
          src={auction.image || PROPERTY_PLACEHOLDER}
          alt={auction.title || "Auction"}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          Ending Soon
        </span>
        {timeLeft?.formatted && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock size={10} />{timeLeft.formatted}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">
            {auction.title || "Investment Opportunity"}
          </h3>
          {auction.location && (
            <p className="text-[11px] text-slate-400 flex items-center gap-0.5 mt-0.5">
              <MapPin size={10} className="flex-shrink-0" />
              <span className="truncate">{auction.location}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 text-[11px] border-t border-slate-100 pt-2">
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">LVR</p>
            <p className="font-bold text-indigo-600">{auction.lvr || 0}%</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Return</p>
            <p className="font-bold text-green-600">{auction.returnRate || 0}%</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium uppercase tracking-wide text-[9px]">Bids</p>
            <p className="font-bold text-slate-800">{auction.totalBids || 0}</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5 text-[11px]">
          <span className="text-slate-500">Current Bid</span>
          <span className="font-bold text-green-600">{formatCurrency(auction.currentBid)}</span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); auction.id && navigate(`/investor/auctions/${auction.id}`); }}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-bold transition-all mt-auto disabled:opacity-50"
          disabled={!auction.id}
        >
          Place Bid
        </button>
      </div>
    </div>
  );
}
