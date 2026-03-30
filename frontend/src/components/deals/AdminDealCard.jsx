import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder'
import { Eye, Gavel, Bed, Bath, Car, Clock, Zap } from "lucide-react";
import useCountdown from "../../hooks/useCountdown";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";
import { useState } from "react";
import { dealsService } from "../../api/dataService";

const TYPE_FALLBACKS = {
  House: PROPERTY_PLACEHOLDER,
  Townhouse: PROPERTY_PLACEHOLDER,
  Apartment: PROPERTY_PLACEHOLDER,
  Unit: PROPERTY_PLACEHOLDER,
  Land: PROPERTY_PLACEHOLDER,
  Commercial: PROPERTY_PLACEHOLDER,
  default: PROPERTY_PLACEHOLDER,
}

export default function AdminDealCard({ deal, onRefresh }) {
  const countdown = useCountdown(deal?.auctionEnd || null);
  const navigate = useNavigate();
  const [listing, setListing] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fallbackImage = TYPE_FALLBACKS[deal?.type] || TYPE_FALLBACKS.default;

  if (!deal) return null;

  const isDraft = deal.dealStatus === 'DRAFT';

  const getStatusConfig = (status) => {
    switch (status) {
      case "Under Contract":
        return { badge: "bg-red-600", text: "UNDER CONTRACT" };
      case "Listed":
        return { badge: "bg-indigo-600", text: "LISTED" };
      case "Draft":
        return { badge: "bg-gray-400", text: "DRAFT" };
      case "Draft (In Auction)":
        return { badge: "bg-orange-500", text: "DRAFT · IN AUCTION" };
      case "Draft (Listed)":
        return { badge: "bg-amber-500", text: "DRAFT · LISTED" };
      case "Live Auction":
        return { badge: "bg-red-600", text: "LIVE AUCTION" };
      case "Coming Soon":
        return { badge: "bg-blue-600", text: "COMING SOON" };
      case "Paused":
        return { badge: "bg-gray-500", text: "PAUSED" };
      case "Ended":
        return { badge: "bg-slate-600", text: "ENDED" };
      case "Settled":
        return { badge: "bg-emerald-600", text: "SETTLED" };
      case "Closed":
        return { badge: "bg-slate-700", text: "CLOSED" };
      case "Sold":
        return { badge: "bg-slate-900", text: "SOLD" };
      default:
        return { badge: "bg-gray-500", text: status?.toUpperCase() };
    }
  };

  const config = getStatusConfig(deal.status);

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

  const getTargetRoom = (id) => `/admin/case-details/${id}`;

  return (
    <div
      onClick={() => navigate(getTargetRoom(deal.case_id || deal.id))}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full cursor-pointer"
    >

      {/* IMAGE SECTION */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={(!imgError && deal.image) ? deal.image : fallbackImage}
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={() => setImgError(true)}
        />

        {/* Status Badge */}
        <div className={`absolute top-4 left-4 ${config.badge} text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest flex items-center gap-2 shadow-lg`}>
          {deal.status === "Live Auction" && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
          {config.text}
        </div>

        {/* Property Specs Overlay */}
        {(deal.bedrooms > 0 || deal.bathrooms > 0 || deal.parking > 0) && (
          <div className="absolute bottom-4 left-4 flex gap-3">
            <SpecItem icon={<Bed size={14} />} value={deal.bedrooms} />
            <SpecItem icon={<Bath size={14} />} value={deal.bathrooms} />
            <SpecItem icon={<Car size={14} />} value={deal.parking} />
          </div>
        )}
      </div>

      {/* CONTENT SECTION */}
      <div className="p-6 flex flex-col flex-1 space-y-4">

        {/* Header */}
        <div className="space-y-1 pb-4 border-b border-gray-50">
          <h3 className="text-xl font-semibold text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors">
            {deal.title}
          </h3>
          <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
            <span role="img" aria-label="location" className="grayscale">📍</span>
            {deal.suburb}, {deal.state} {deal.postcode}
          </p>
        </div>

        {/* Values Section */}
        <div className="space-y-2.5">
          <ValueRow label="Loan Amount" value={formatCurrency(deal.loanAmount)} />

          {(deal.status === "Live Auction" || deal.status === "Under Contract") && (
            <ValueRow
              label="Current Bid"
              value={formatCurrency(deal.currentBid)}
              color="text-green-600"
              bold
            />
          )}

          {(deal.status === "Buy Now" || deal.status === "Active") && (
            <ValueRow
              label="Fixed Price"
              value={formatCurrency(deal.buyNowPrice || deal.loanAmount)}
              color="text-green-600"
              bold
            />
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <StatBox label="LVR" value={`${deal.lvr}%`} color="text-indigo-600" />
          <StatBox label="Return" value={`${deal.returnRate}%`} color="text-green-600" />
          <StatBox label="Type" value={deal.type} color="text-gray-900" />
        </div>

        {/* Secondary Info (Auction Date / Countdown) */}
        <div className="flex-1 flex flex-col justify-end space-y-4">

          {isDraft && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between items-center">
              <div className="flex items-center gap-2 text-amber-700">
                <Zap size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Action needed</span>
              </div>
              <span className="text-xs font-bold text-amber-700">List to activate</span>
            </div>
          )}

          {(deal.status === "Live Auction" || deal.status === "Under Contract") && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-600">
                <Clock size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Ends in</span>
              </div>
              <span className="text-xs font-bold text-red-600">{countdown?.formatted || "Soon"}</span>
            </div>
          )}

          {/* Footer Info (ID & Bids) */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              {deal.case_number ? `REF: ${deal.case_number}` : `REF: #${deal.id?.slice(-6).toUpperCase()}`}
            </span>
            {deal.totalBids > 0 && (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{deal.totalBids} bids</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {(deal.status === "Live Auction" || deal.status === "Under Contract") ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/admin/buy-now/${deal.id}`); }}
                  className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 text-sm"
                >
                  <Gavel size={16} />
                  View Auction
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/admin/buy-now/${deal.id}`); }}
                  className="bg-gray-50 border border-gray-100 text-gray-400 p-3 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <Eye size={18} />
                </button>
              </>
            ) : (
              <div className="flex w-full gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(getTargetRoom(deal.case_id || deal.id)); }}
                  className="flex-1 bg-white border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Eye size={14} />
                    View Case
                  </div>
                </button>
                {isDraft && (
                  <button
                    onClick={handleListDeal}
                    disabled={listing}
                    className="flex-1 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Zap size={14} />
                    {listing ? 'Listing...' : 'List Deal'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecItem({ icon, value }) {
  return (
    <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-lg flex items-center gap-2 border border-white/10 shadow-lg">
      <span className="opacity-70">{icon}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function ValueRow({ label, value, color = "text-gray-900", bold = false }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
      <span className="text-sm text-gray-400 font-medium">{label}</span>
      <span className={`text-lg transition-colors ${bold ? 'font-semibold' : 'font-medium'} ${color}`}>{value}</span>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="text-center space-y-1">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}
