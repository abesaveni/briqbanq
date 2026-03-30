import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder'
import { useNavigate } from "react-router-dom";
import useCountdown from "../../hooks/useCountdown";
import { formatCurrency } from "../../utils/formatters";
import {
    BedDouble,
    Bath,
    Car,
    Clock,
    Users,
    AlertTriangle,
} from "lucide-react";

export default function LenderAuctionCard({ auction }) {

    const navigate = useNavigate();

    if (!auction) return null;

    const isLive = auction.status === "live";
    const isBuyNow = auction.status === "buy-now";
    const timeLeft = useCountdown(auction.endTime);

    const getTargetRoom = (id) => {
        if (isBuyNow) return `/lender/buy-now/${id}`;
        return `/lender/auctions/${id}`;
    };

    return (
        <div
            onClick={() => navigate(getTargetRoom(auction.id))}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
        >

            {/* IMAGE SECTION */}
            <div className="relative h-64">

                <img
                    src={auction.image || PROPERTY_PLACEHOLDER}
                    alt={auction.title || "Auction"}
                    className="w-full h-full object-cover"
                />

                {/* STATUS BADGE */}
                <div className="absolute top-4 left-4">
                    {isLive ? (
                        <span className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            LIVE NOW
                        </span>
                    ) : isBuyNow ? (
                        <span className="bg-green-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                            BUY NOW
                        </span>
                    ) : (
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                            UPCOMING
                        </span>
                    )}
                </div>

                {/* END TIMER */}
                {isLive && (
                    <div className="absolute bottom-14 left-4 right-4 bg-red-600/95 backdrop-blur-sm text-white rounded-xl px-4 py-2 flex justify-between items-center shadow-xl">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="opacity-80" />
                            <span className="text-[11px] uppercase font-bold tracking-wider">Ends in</span>
                        </div>
                        <span className="text-base font-bold">{timeLeft.formatted || "Soon"}</span>
                    </div>
                )}

                {/* PROPERTY ICONS */}
                {(auction.bedrooms > 0 || auction.bathrooms > 0 || auction.parking > 0) && (
                    <div className="absolute bottom-4 left-4 flex gap-2 text-white">
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                            <BedDouble size={14} />
                            {auction.bedrooms}
                        </div>
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                            <Bath size={14} />
                            {auction.bathrooms}
                        </div>
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold">
                            <Car size={14} />
                            {auction.parking}
                        </div>
                    </div>
                )}

            </div>

            {/* CONTENT SECTION */}
            <div className="p-6">

                {/* TITLE */}
                <div className="space-y-1 pb-4 border-b border-gray-100 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 truncate uppercase">
                        {auction.title || "Investment Property"}
                    </h3>
                    <p className="text-gray-500 text-sm font-medium italic">
                        {auction.suburb || "Suburb"}, {auction.state || "State"}
                    </p>
                </div>

                {/* BADGES ROW */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-red-100">
                        Default {auction.defaultDays || 0}d
                    </div>
                    <div className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-orange-100">
                        Arrears {auction.arrearsDays || 0}d
                    </div>
                    <div className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-purple-100">
                        Rate {auction.returnRate || 0}%
                    </div>
                </div>

                <div className="space-y-2.5 mb-6">
                    <div className="flex justify-between items-center text-gray-500 border-b border-gray-100 pb-2.5">
                        <span className="text-sm font-medium">Outstanding Debt</span>
                        <span className="font-bold text-gray-900">
                            {formatCurrency(auction.outstandingDebt)}
                        </span>
                    </div>

                    {auction.currentBid > 0 && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                            <span className="text-sm text-gray-500 font-medium">Current Bid</span>
                            <span className="text-green-600 font-black text-lg tracking-tighter">
                                {formatCurrency(auction.currentBid)}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between items-center text-gray-500 border-b border-gray-100 pb-2.5">
                        <span className="text-sm font-medium">Property Value</span>
                        <span className="font-bold text-gray-900">
                            {formatCurrency(auction.propertyValue)}
                        </span>
                    </div>

                    <div className="flex justify-between items-center pt-2.5">
                        <span className="text-sm text-gray-500 font-medium">LVR</span>
                        <span className="text-indigo-600 font-bold px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
                            {auction.lvr || 0}%
                        </span>
                    </div>
                </div>

                {/* ACTIVITY ROW */}
                {(auction.bidders || auction.activity) && (
                    <div className="flex justify-between items-center mt-6 text-[10px] font-bold uppercase tracking-widest bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 font-bold">
                            <Users size={14} />
                            {auction.bidders || 0} active bidders
                        </div>

                        {auction.activity === "high" && (
                            <div className="flex items-center gap-2 text-orange-500 font-bold">
                                <AlertTriangle size={14} />
                                High Activity
                            </div>
                        )}
                    </div>
                )}

                {/* EXPECTED RETURN BOX */}
                <div className="bg-green-50 border border-green-100 rounded-[1.5rem] p-5 mt-6 flex justify-between items-center shadow-sm">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-green-600/70 tracking-widest mb-1">Expected Return</p>
                        <p className="text-2xl font-black text-green-700 tracking-tighter">
                            {auction.expectedReturn || auction.returnRate || 0}%
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-green-600/70 tracking-widest mb-1">Equity</p>
                        <p className="text-2xl font-black text-green-700 tracking-tighter">
                            {formatCurrency(auction.equity)}
                        </p>
                    </div>
                </div>

                {/* BUTTONS */}
                <div className="flex gap-3 mt-6">
                    {isLive ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/lender/auctions/${auction.id}`); }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-50 text-xs"
                            disabled={!auction.id}
                        >
                            Place Bid Now
                        </button>
                    ) : isBuyNow ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/lender/buy-now/${auction.id}`); }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-green-100 active:scale-[0.98] text-xs"
                        >
                            Buy Now
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/lender/auctions/${auction.id}`); }}
                            className="flex-1 bg-white border border-gray-200 py-3.5 rounded-2xl font-bold hover:bg-gray-50 transition-all text-gray-700 text-xs"
                        >
                            View Property Details
                        </button>
                    )}
                </div>

                <p className="text-center text-gray-300 text-[10px] font-bold uppercase mt-6 tracking-widest font-mono">
                    {auction.case_number ? `REF: ${auction.case_number}` : `REF: #${String(auction.id || '').slice(-6).toUpperCase()}`}
                </p>

            </div>
        </div>
    );
}
