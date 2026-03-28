import { formatCurrency } from "../../utils/formatters";
import { History, User, CheckCircle2, TrendingUp } from "lucide-react";
import PropTypes from 'prop-types';

/**
 * BidHistory: Displays a scrollable list of recent bids.
 * Balanced for high-fidelity UI and backend readiness.
 */
export default function BidHistory({ history = [] }) {
  // Ensure we always have an array
  const bidList = Array.isArray(history) ? history : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-2.5 text-gray-900 font-bold">
        <TrendingUp size={20} className="text-indigo-600" />
        Bid History ({bidList.length} bids)
      </div>

      <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
        {bidList.length > 0 ? (
          <div>
            {bidList.map((bid, i) => {
              const isLatest = i === 0;
              const isYou = bid.user === "You";
              return (
                <div
                  key={`${bid.amount}-${bid.time}-${i}`}
                  className={`flex justify-between items-center p-5 transition-all duration-300 border-b border-gray-50 hover:bg-gray-50 ${isLatest ? 'bg-indigo-50/20' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">{bid.user || "Investor"}</span>
                        {isYou && (
                          <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">You</span>
                        )}
                        {isLatest && <CheckCircle2 size={14} className="text-green-500" />}
                      </div>
                      <span className="text-2xl font-bold text-gray-900 tracking-tight">{formatCurrency(bid.amount || 0)}</span>
                      {isLatest && (
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">Winning</p>
                      )}
                      {!isLatest && (
                        <p className="text-[10px] font-medium text-gray-400 mt-1">Outbid</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-medium text-gray-400 block">{bid.time || "Recently"}</span>
                    <span className="text-xs font-bold text-gray-300 block mt-1">
                      {i < bidList.length - 1 ? `+${formatCurrency((bid.amount || 0) - (bidList[i + 1]?.amount || 0))}` : "Start"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="bg-gray-50 p-4 rounded-full mb-3">
              <History size={24} className="text-gray-300" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">No activity yet</p>
            <p className="text-[10px] text-gray-400 mt-1 max-w-[150px] mx-auto">Be the first to secure your position on this asset.</p>
          </div>
        )}
      </div>
    </div>
  );
}

BidHistory.propTypes = {
  history: PropTypes.arrayOf(PropTypes.shape({
    user: PropTypes.string,
    amount: PropTypes.number,
    time: PropTypes.string
  }))
};
