import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder'
import { useNavigate } from "react-router-dom";
import useCountdown from "../../hooks/useCountdown";
import { Heart } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export default function InvestorEndingSoonCard({ auction }) {
  const navigate = useNavigate();
  const timeLeft = useCountdown(auction?.endTime);

  if (!auction) return null;

  return (
    <div
      onClick={() => auction.id && navigate(`/investor/auctions/${auction.id}`)}
      className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 max-w-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
    >

      {/* IMAGE */}
      <div className="relative">
        <img
          src={auction.image || PROPERTY_PLACEHOLDER}
          alt={auction.title || "Auction"}
          className="w-full h-[220px] object-cover"
        />

        {/* Countdown */}
        <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg">
          <span role="img" aria-label="clock">⏰</span>
          <span className="text-xs uppercase tracking-wider opacity-90">Ends in</span>
          <span className="ml-1 text-lg font-bold">{timeLeft.formatted || "Soon"}</span>
        </div>


      </div>

      {/* CONTENT */}
      <div className="p-6">
        <div className="pb-4 border-b border-gray-100 mb-4">
          <h2 className="text-lg font-bold text-gray-900 truncate">
            {auction.title || "Investment Opportunity"}
          </h2>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
            <span role="img" aria-label="location">📍</span> {auction.location || "Location TBD"}
          </p>
        </div>

        {/* Bid Box */}
        <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 mt-2 group hover:bg-green-50 transition-colors">
          <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest border-b border-green-100 pb-2 mb-2">
            Current Highest Bid
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-green-600">
              {formatCurrency(auction.currentBid)}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium italic">
            {auction.totalBids || 0} competitive bids placed
          </p>
        </div>

        {/* LVR / Return / Risk */}
        <div className="grid grid-cols-3 gap-4 mt-6 border-t border-gray-100 pt-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">LVR</p>
            <p className="font-bold text-indigo-600 text-lg">
              {auction.lvr || 0}%
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Return</p>
            <p className="font-bold text-green-600 text-lg">
              {auction.returnRate || 0}%
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Risk</p>
            <p className="font-bold text-gray-700 text-lg">
              {auction.risk || "N/A"}
            </p>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={(e) => { e.stopPropagation(); auction.id && navigate(`/investor/auctions/${auction.id}`); }}
          className="mt-6 w-full bg-indigo-700 text-white py-3.5 rounded-2xl font-bold hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-50 text-sm"
          disabled={!auction.id}
        >
          Place Bid Now
        </button>
      </div>
    </div>
  );
}
