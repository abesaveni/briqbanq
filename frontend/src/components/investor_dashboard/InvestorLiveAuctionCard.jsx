import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder'
import { useNavigate } from "react-router-dom";
import useBlink from "../../hooks/useBlink";
import { formatCurrency } from "../../utils/formatters";

export default function InvestorLiveAuctionCard({ auction }) {
  const navigate = useNavigate();
  const isVisible = useBlink();

  if (!auction) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10">
      <img
        src={auction.image || PROPERTY_PLACEHOLDER}
        alt={auction.title || "Live Auction"}
        className="w-full h-[300px] object-cover"
      />

      {/* LIVE Badge */}
      <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold shadow-lg">
        <span
          className="w-2 h-2 bg-white rounded-full"
          style={{ opacity: isVisible ? 1 : 0.3 }}
        ></span>
        LIVE AUCTION
      </div>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-white">
        <h2 className="text-xl font-semibold truncate">{auction.title || "Featured Auction"}</h2>
        <p className="text-sm text-gray-300">{auction.location || "Multiple Locations"}</p>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Current Bid</p>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(auction.currentBid)}
            </p>
          </div>

          <button
            onClick={() => auction.id && navigate(`/investor/auctions/${auction.id}`)}
            className="bg-white text-black px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg active:scale-95 disabled:opacity-50"
            disabled={!auction.id}
          >
            Place Bid →
          </button>
        </div>
      </div>
    </div>
  );
}
