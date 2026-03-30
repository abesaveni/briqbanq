import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder'
import { Eye, Gavel, ShoppingCart, Calendar, Bed, Bath, Car, Clock } from "lucide-react";
import useCountdown from "../../hooks/useCountdown";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";

export default function LenderDealCard({ deal }) {
    const countdown = useCountdown(deal?.auctionEnd || null);
    const navigate = useNavigate();

    if (!deal) return null;

    const getStatusConfig = (status) => {
        switch (status) {
            case "Live Auction":
                return { badge: "bg-red-600", text: "LIVE AUCTION" };
            case "Coming Soon":
                return { badge: "bg-blue-600", text: "COMING SOON" };
            case "Buy Now":
            case "Active":
                return { badge: "bg-green-600", text: "BUY NOW" };
            case "Sold":
                return { badge: "bg-slate-900", text: "SOLD" };
            default:
                return { badge: "bg-gray-500", text: status?.toUpperCase() };
        }
    };

    const config = getStatusConfig(deal.status);

    // For deals from the deals table, use case_id for case-based routes (LenderAuctionRoom)
    // For live cases mapped directly, id IS the case_id already
    const caseRouteId = deal.case_id || deal.id;

    const getTargetRoom = (id, caseId, status) => {
        if (status === "Buy Now" || status === "Active") return `/lender/buy-now/${id}`;
        return `/lender/auctions/${caseId}`;
    };

    return (
        <div
            onClick={() => navigate(getTargetRoom(deal.id, caseRouteId, deal.status))}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full cursor-pointer"
        >

            {/* IMAGE SECTION */}
            <div className="relative h-64 overflow-hidden">
                <img
                    src={deal.image || PROPERTY_PLACEHOLDER}
                    alt={deal.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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

                    {deal.status === "Live Auction" && (
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

                    {deal.status === "Coming Soon" && (
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Calendar size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Auction</span>
                            </div>
                            <span className="text-xs font-bold text-indigo-700">18 Feb 2026</span>
                        </div>
                    )}

                    {deal.status === "Live Auction" && (
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
                            {deal.case_number ? `REF: ${deal.case_number}` : `REF: #${String(deal.id || '').slice(-6).toUpperCase()}`}
                        </span>
                        {deal.totalBids > 0 && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{deal.totalBids} bids</span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {deal.status === "Live Auction" ? (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/lender/auctions/${caseRouteId}`); }}
                                    className="flex-1 bg-indigo-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 text-sm"
                                >
                                    <Gavel size={16} />
                                    Place Bid
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/lender/auctions/${caseRouteId}`); }}
                                    className="bg-gray-50 border border-gray-100 text-gray-400 p-3 rounded-xl hover:bg-gray-100 transition-all"
                                >
                                    <Eye size={18} />
                                </button>
                            </>
                        ) : (deal.status === "Coming Soon" || deal.status === "Buy Now" || deal.status === "Active") ? (
                            <div className="flex w-full gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(getTargetRoom(deal.id, caseRouteId, deal.status)); }}
                                    className="flex-1 bg-white border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Eye size={14} />
                                        View
                                    </div>
                                </button>
                                {(deal.status === "Buy Now" || deal.status === "Active") && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/lender/buy-now/${deal.id}`); }}
                                        className="flex-1 bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart size={14} />
                                        Buy Now
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/lender/auctions/${caseRouteId}`); }}
                                className="w-full bg-white border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Eye size={18} />
                                View Details
                            </button>
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
