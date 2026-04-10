import { useState, useMemo } from "react";
import { formatCurrency } from "../../utils/formatters";
import { Gavel, TrendingUp, Info, Calculator, CreditCard } from "lucide-react";
import PropTypes from 'prop-types';

/**
 * BidPanel: The core bidding interface.
 * Features auto-calculation for premiums, total investment, and multi-step validation.
 */
export default function BidPanel({ currentBid = 0, startingPrice = 0, minimumIncrement = 100, placeBid, isOwnCase = false }) {
  const [amount, setAmount] = useState("");
  const minIncrement = minimumIncrement || 100;
  const buyerPremiumRate = 0.02;

  // Minimum valid bid: if no bids yet use starting_price, else current + increment
  const floor = currentBid > 0
    ? currentBid + minIncrement
    : Math.max(startingPrice, minIncrement);
  const recommendedBid = floor;

  const results = useMemo(() => {
    const bidValue = Number(amount) || 0;
    const premium = bidValue * buyerPremiumRate;
    const total = bidValue + premium;
    return { premium, total, bidValue };
  }, [amount]);

  // Handlers
  const handleQuickAdd = (increment) => {
    const currentBase = Number(amount) || currentBid;
    setAmount((currentBase + increment).toString());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const bidAmount = Number(amount);

    if (!bidAmount) return;

    if (bidAmount <= (currentBid || 0)) {
      alert(`Your bid must be higher than the current highest bid of ${formatCurrency(currentBid)}`);
      return;
    }

    if (bidAmount < (currentBid || 0) + minIncrement) {
      alert(`Minimum increment is ${formatCurrency(minIncrement)}. Please bid at least ${formatCurrency((currentBid || 0) + minIncrement)}`);
      return;
    }

    placeBid(bidAmount);
    setAmount("");
  };

  if (isOwnCase) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
        <div className="bg-amber-50 p-5 border-b border-amber-100 flex items-center gap-2.5 text-amber-800 font-bold">
          <Gavel size={20} className="text-amber-600" />
          Bidding Not Available
        </div>
        <div className="p-6">
          <p className="text-sm text-amber-700 font-medium">You cannot bid on a case you submitted. This restriction ensures fair participation for all bidders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-50/80 p-5 border-b border-indigo-100 flex items-center gap-2.5 text-indigo-900 font-bold">
        <Gavel size={20} className="text-indigo-600" />
        Place Your Bid
      </div>

      <div className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-2 block">
              Bid Amount (AUD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">A$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-gray-200 p-3.5 pl-10 rounded-xl focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all outline-none font-bold text-lg text-gray-900 placeholder:text-gray-300"
                placeholder={recommendedBid.toString()}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">
              Minimum bid: {formatCurrency(floor)} • Current bid: {formatCurrency(currentBid)}
            </p>
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <QuickBidButton label={`A$${Math.round((floor+10000)/1000)}k`} onClick={() => setAmount((floor + 10000).toString())} />
            <QuickBidButton label={`A$${Math.round((floor+25000)/1000)}k`} onClick={() => setAmount((floor + 25000).toString())} />
            <QuickBidButton label={`A$${Math.round((floor+50000)/1000)}k`} onClick={() => setAmount((floor + 50000).toString())} />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-800 shadow-md shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            disabled={results.bidValue < recommendedBid}
          >
            <Gavel size={16} />
            Place Bid
          </button>

          {/* Investment Breakdown */}
          {results.bidValue > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                <span>Your bid:</span>
                <span className="font-bold text-gray-900">{formatCurrency(results.bidValue)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                <span>Buyer premium (2%):</span>
                <span className="font-bold text-gray-900">{formatCurrency(results.premium)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-sm font-bold text-gray-900">
                <span>Total investment:</span>
                <span>{formatCurrency(results.total)}</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function QuickBidButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
    >
      {label}
    </button>
  );
}

BidPanel.propTypes = {
  currentBid: PropTypes.number,
  placeBid: PropTypes.func.isRequired
};
