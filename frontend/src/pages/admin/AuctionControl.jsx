import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder'
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuctionStats from "../../components/auctions/AuctionStats";
import { auctionService } from "../../api/dataService";
import { Search, Gavel, Clock, Users, TrendingUp, Eye, BedDouble, Bath, Car, AlertTriangle, SlidersHorizontal, X } from "lucide-react";

const DEFAULT_ADVANCED = { minLvr: '', maxLvr: '', minValue: '', maxValue: '', minBidders: '' };

// Maps backend AuctionStatus enum → card display status (lowercase)
const AUCTION_STATUS_MAP = {
    LIVE: 'live',
    SCHEDULED: 'upcoming',
    PAUSED: 'paused',
    ENDED: 'ended',
}

function normalizeAuction(a) {
    const bidCount = a.bid_count || 0
    const startingPrice = Number(a.starting_price) || 0
    const estimatedValue = Number(a.estimated_value) || 0
    const propertyValue = estimatedValue || startingPrice
    const lvr = estimatedValue > 0 ? Math.round((startingPrice / estimatedValue) * 100) : 0
    const location = [a.suburb, a.state, a.postcode].filter(Boolean).join(', ') || a.property_address || a.title
    const images = Array.isArray(a.property_images) && a.property_images.length > 0 ? a.property_images : []
    const image = images[0] || null
    return {
        ...a,
        status: AUCTION_STATUS_MAP[a.status] || a.status?.toLowerCase() || 'upcoming',
        currentBid: Number(a.current_highest_bid) || 0,
        outstandingDebt: startingPrice,
        propertyValue,
        endTime: a.scheduled_end,
        location,
        lvr,
        bidders: bidCount,
        activity: bidCount > 5 ? 'high' : 'normal',
        expectedReturn: 0,
        image,
        images,
        bedrooms: a.bedrooms || 0,
        bathrooms: a.bathrooms || 0,
        parking: a.parking || 0,
    }
}

function formatCurrency(amount) {
    if (!amount && amount !== 0) return "—";
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(amount);
}

const STATUS_STYLES = {
    live: "bg-red-500 text-white",
    upcoming: "bg-blue-500 text-white",
    ended: "bg-gray-500 text-white",
    active: "bg-emerald-500 text-white",
    "buy-now": "bg-green-500 text-white",
};

function AdminAuctionCard({ auction, onView }) {
    const isLive = auction.status === "live";
    return (
        <div
            onClick={() => onView(auction.id)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 cursor-pointer"
        >
            {/* Image */}
            <div className="relative h-52">
                <img
                    src={auction.image || PROPERTY_PLACEHOLDER}
                    alt={auction.title || "Auction"}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${STATUS_STYLES[auction.status] || "bg-gray-500 text-white"}`}>
                        {isLive && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                        {isLive ? "LIVE NOW" : (auction.status || "UPCOMING").toUpperCase()}
                    </span>
                </div>
                <div className="absolute bottom-3 left-3 flex gap-2 text-white text-xs">
                    {[
                        { Icon: BedDouble, val: auction.bedrooms },
                        { Icon: Bath, val: auction.bathrooms },
                        { Icon: Car, val: auction.parking }
                    ].map(({ Icon, val }, i) => (
                        <span key={i} className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 font-bold">
                            <Icon className="w-3 h-3" />{val || 0}
                        </span>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                <div>
                    <h3 className="text-base font-bold text-gray-900 truncate">{auction.title || "Investment Property"}</h3>
                    <p className="text-sm text-gray-500">{auction.location || `${auction.suburb}, ${auction.state}`}</p>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Outstanding Debt</span>
                        <span className="font-bold text-gray-900">{formatCurrency(auction.outstandingDebt)}</span>
                    </div>
                    {auction.currentBid > 0 && (
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-gray-500">Current Bid</span>
                            <span className="font-bold text-green-600">{formatCurrency(auction.currentBid)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Property Value</span>
                        <span className="font-bold text-gray-900">{formatCurrency(auction.propertyValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">LVR</span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{auction.lvr || 0}%</span>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide">
                    <span className="text-gray-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />{auction.bidders || 0} bidders
                    </span>
                    {auction.activity === "high" && (
                        <span className="text-orange-500 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />High Activity
                        </span>
                    )}
                    <span className="text-green-600 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />{auction.expectedReturn || auction.returnRate || 0}%
                    </span>
                </div>

                {/* View Room button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onView(auction.id); }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                    <Eye className="w-4 h-4" />
                    {isLive ? "Enter Auction Room" : "View Details"}
                </button>

                <p className="text-center text-gray-300 text-xs font-medium uppercase tracking-widest">
                    Ref: {auction.id || "N/A"}
                </p>
            </div>
        </div>
    );
}

export default function AuctionControl() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortOption, setSortOption] = useState("ending");
    const [auctionsData, setAuctionsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [advanced, setAdvanced] = useState(DEFAULT_ADVANCED);

    useEffect(() => {
        const load = async () => {
            const res = await auctionService.getAuctions();
            if (res.success) {
                const raw = Array.isArray(res.data) ? res.data : (res.data?.items || []);
                // Auto-start any SCHEDULED auctions (they should be LIVE since case is in AUCTION status)
                const toStart = raw.filter(a => a.status === 'SCHEDULED');
                if (toStart.length > 0) {
                    await Promise.allSettled(toStart.map(a => auctionService.startAuction(a.id)));
                    // Re-fetch after starting
                    const res2 = await auctionService.getAuctions();
                    if (res2.success) {
                        const raw2 = Array.isArray(res2.data) ? res2.data : (res2.data?.items || []);
                        setAuctionsData(raw2.map(normalizeAuction));
                        setLoading(false);
                        return;
                    }
                }
                setAuctionsData(raw.map(normalizeAuction));
            }
            setLoading(false);
        };
        load();
    }, []);

    const activeAdvancedCount = Object.values(advanced).filter(v => v !== '').length;

    const filteredAuctions = useMemo(() => {
        let result = auctionsData.filter((auction) => {
            const matchesSearch =
                auction.title?.toLowerCase().includes(search.toLowerCase()) ||
                auction.location?.toLowerCase().includes(search.toLowerCase()) ||
                auction.property_address?.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = filterStatus === "all" || auction.status === filterStatus;
            if (!matchesSearch || !matchesStatus) return false;
            if (advanced.minLvr && (auction.lvr || 0) < parseFloat(advanced.minLvr)) return false;
            if (advanced.maxLvr && (auction.lvr || 0) > parseFloat(advanced.maxLvr)) return false;
            if (advanced.minValue && (auction.propertyValue || 0) < parseFloat(advanced.minValue)) return false;
            if (advanced.maxValue && (auction.propertyValue || 0) > parseFloat(advanced.maxValue)) return false;
            if (advanced.minBidders && (auction.bidders || 0) < parseInt(advanced.minBidders)) return false;
            return true;
        });

        if (sortOption === "low-high") result.sort((a, b) => (a.propertyValue || 0) - (b.propertyValue || 0));
        if (sortOption === "high-low") result.sort((a, b) => (b.propertyValue || 0) - (a.propertyValue || 0));
        if (sortOption === "ending") result.sort((a, b) => new Date(a.endTime || a.scheduled_end || 0) - new Date(b.endTime || b.scheduled_end || 0));

        return result;
    }, [search, filterStatus, sortOption, auctionsData, advanced]);

    const handleViewRoom = (auctionId) => {
        navigate(`/admin/auction-room/${auctionId}`);
    };

    return (
        <div className="space-y-8">
            <div className="mb-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Active Auctions Management</h2>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                    Monitor and manage live auction processes and active bids
                </p>
            </div>

            <AuctionStats auctions={auctionsData} loading={loading} />

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search auctions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                >
                    <option value="all">All Status</option>
                    <option value="live">Live</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ended">Ended</option>
                </select>
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                >
                    <option value="ending">Ending Soon</option>
                    <option value="low-high">Price: Low → High</option>
                    <option value="high-low">Price: High → Low</option>
                </select>
                <button
                    onClick={() => setShowAdvancedFilters(p => !p)}
                    className={`relative flex items-center gap-2 border px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ml-auto ${
                        showAdvancedFilters || activeAdvancedCount > 0
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <SlidersHorizontal size={14} />
                    Advanced Filters
                    {activeAdvancedCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {activeAdvancedCount}
                        </span>
                    )}
                </button>
            </div>

            {showAdvancedFilters && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 -mt-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <SlidersHorizontal size={14} className="text-indigo-600" />
                            Advanced Filters
                        </h3>
                        <div className="flex gap-3">
                            {activeAdvancedCount > 0 && (
                                <button onClick={() => setAdvanced(DEFAULT_ADVANCED)} className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1">
                                    <X size={12} /> Reset
                                </button>
                            )}
                            <button onClick={() => setShowAdvancedFilters(false)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            { key: 'minLvr', label: 'Min LVR (%)', ph: '0' },
                            { key: 'maxLvr', label: 'Max LVR (%)', ph: 'Any' },
                            { key: 'minValue', label: 'Min Value (A$)', ph: '0' },
                            { key: 'maxValue', label: 'Max Value (A$)', ph: 'Any' },
                            { key: 'minBidders', label: 'Min Bidders', ph: '0' },
                        ].map(({ key, label, ph }) => (
                            <div key={key} className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
                                <input
                                    type="number"
                                    placeholder={ph}
                                    value={advanced[key]}
                                    onChange={(e) => setAdvanced(p => ({ ...p, [key]: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAuctions.length > 0 ? (
                    filteredAuctions.map((auction) => (
                        <AdminAuctionCard
                            key={auction.id}
                            auction={auction}
                            onView={handleViewRoom}
                        />
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                        <Gavel className="w-12 h-12 mb-3 text-gray-300" />
                        <p className="font-bold text-gray-500">No auctions found</p>
                        <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
