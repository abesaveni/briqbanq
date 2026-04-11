import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auctionService, casesService } from "../../api/dataService";
import { LoadingState, ErrorState } from "../../components/common/States";
import { formatCurrency } from "../../utils/formatters";
import {
    Gavel, TrendingUp, CheckCircle2, Trophy, DollarSign, Bookmark,
    Clock, MapPin, ArrowRight, ChevronRight, Zap, AlertCircle
} from "lucide-react";
import useCountdown from "../../hooks/useCountdown";
import { PROPERTY_PLACEHOLDER } from "../../utils/propertyPlaceholder";

function AuctionCountdown({ endTime }) {
    const { formatted } = useCountdown(endTime);
    return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
            <Clock size={11} /> {formatted || "Ending soon"}
        </span>
    );
}

function StatCard({ icon: Icon, label, value, sub, color, onClick }) {
    return (
        <button
            onClick={onClick}
            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left group w-full"
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{value}</p>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </button>
    );
}

export default function InvestorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const firstName = user?.firstName || (user?.name || "").split(" ")[0] || "Investor";

    const [myBids, setMyBids] = useState([]);
    const [liveAuctions, setLiveAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                setError(null);
                const [bidsRes, auctionsRes] = await Promise.all([
                    auctionService.getMyBids(),
                    casesService.getLiveListings(),
                ]);
                if (bidsRes.success) {
                    const raw = Array.isArray(bidsRes.data)
                        ? bidsRes.data
                        : (bidsRes.data?.items || []);
                    setMyBids(raw);
                }
                if (auctionsRes.success) {
                    const raw = Array.isArray(auctionsRes.data)
                        ? auctionsRes.data
                        : (auctionsRes.data?.items || []);
                    setLiveAuctions(raw);
                }
            } catch (err) {
                if (err.response?.status !== 401) {
                    setError(err.message || "Failed to load dashboard data.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const watchlistCount = useMemo(() => {
        try {
            const wl = JSON.parse(localStorage.getItem("investor_watchlist") || "[]");
            return Array.isArray(wl) ? wl.length : 0;
        } catch {
            return 0;
        }
    }, []);

    const stats = useMemo(() => {
        // Backend /cases/live returns auction_status as "LIVE", "SCHEDULED", etc.
        const liveCount = liveAuctions.filter(a => a.auction_status === "LIVE").length;
        const activeCount = myBids.length;
        // Backend /bids/my-bids returns bid.status (not bid.bid_status)
        const winningCount = myBids.filter(b =>
            (b.status || "").toUpperCase() === "WINNING"
        ).length;
        const wonCount = myBids.filter(b =>
            (b.status || "").toUpperCase() === "WON"
        ).length;
        const totalBidValue = myBids.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
        return { liveCount, activeCount, winningCount, wonCount, totalBidValue };
    }, [myBids, liveAuctions]);

    // Auctions ending soonest (live only, with endTime)
    const endingSoon = useMemo(() => {
        return liveAuctions
            .filter(a => a.auction_status === "LIVE" && a.auction_scheduled_end)
            .sort((a, b) => new Date(a.auction_scheduled_end) - new Date(b.auction_scheduled_end))
            .slice(0, 4);
    }, [liveAuctions]);

    // Most recent bids
    const recentBids = useMemo(() => {
        return [...myBids]
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 5);
    }, [myBids]);

    const getBidStatusBadge = (bid) => {
        // Backend returns bid.status (WINNING, WON, OUTBID, LOST, ACTIVE)
        const s = (bid.status || "").toUpperCase();
        if (s === "WINNING") return { label: "Winning", cls: "bg-emerald-100 text-emerald-700" };
        if (s === "WON") return { label: "Won", cls: "bg-blue-100 text-blue-700" };
        if (s === "OUTBID") return { label: "Outbid", cls: "bg-amber-100 text-amber-700" };
        if (s === "LOST") return { label: "Lost", cls: "bg-gray-100 text-gray-500" };
        return { label: "Active", cls: "bg-indigo-100 text-indigo-700" };
    };

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
                <p className="text-sm text-gray-500 mt-1">Track your bids, monitor live auctions and manage your watchlist.</p>
            </div>

            {/* 6 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                    icon={Gavel}
                    label="Live Auctions"
                    value={stats.liveCount}
                    color="bg-emerald-500"
                    onClick={() => navigate("/investor/auctions")}
                />
                <StatCard
                    icon={TrendingUp}
                    label="My Active Bids"
                    value={stats.activeCount}
                    color="bg-indigo-500"
                    onClick={() => navigate("/investor/my-bids")}
                />
                <StatCard
                    icon={Zap}
                    label="Winning Bids"
                    value={stats.winningCount}
                    color="bg-sky-500"
                    onClick={() => navigate("/investor/my-bids")}
                />
                <StatCard
                    icon={Trophy}
                    label="Auctions Won"
                    value={stats.wonCount}
                    color="bg-violet-500"
                    onClick={() => navigate("/investor/my-bids")}
                />
                <StatCard
                    icon={DollarSign}
                    label="Total Bid Value"
                    value={formatCurrency(stats.totalBidValue)}
                    color="bg-rose-500"
                    onClick={() => navigate("/investor/my-bids")}
                />
                <StatCard
                    icon={Bookmark}
                    label="Watchlist"
                    value={watchlistCount}
                    color="bg-amber-500"
                    onClick={() => navigate("/investor/watchlist")}
                />
            </div>

            {/* Main grid: Ending Soon + Recent Bids */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Ending Soon */}
                <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-amber-500" />
                            <h2 className="text-sm font-bold text-gray-900">Ending Soon</h2>
                        </div>
                        <button
                            onClick={() => navigate("/investor/auctions")}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                        >
                            View all <ChevronRight size={14} />
                        </button>
                    </div>
                    {endingSoon.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <Gavel size={32} className="text-gray-200 mb-3" />
                            <p className="text-sm font-medium text-gray-500">No live auctions ending soon</p>
                            <button
                                onClick={() => navigate("/investor/auctions")}
                                className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
                            >
                                Browse all auctions
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {endingSoon.map((a) => {
                                const meta = a.metadata_json || {};
                                const suburb = meta.suburb || a.suburb || "";
                                const state = meta.state || a.state || "";
                                const location = [suburb, state].filter(Boolean).join(", ");
                                const images = Array.isArray(a.property_images) ? a.property_images : (meta.property_images || []);
                                const img = images[0] || null;
                                const debt = parseFloat(a.outstanding_debt) || 0;
                                const val = parseFloat(a.estimated_value) || 0;
                                const lvr = val > 0 ? Math.round((debt / val) * 100) : 0;
                                return (
                                    <div
                                        key={a.id}
                                        onClick={() => navigate(`/investor/auctions/${a.id}`)}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                            <img
                                                src={img || PROPERTY_PLACEHOLDER}
                                                alt={a.title || "Property"}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{a.title || a.property_address || "Investment Property"}</p>
                                            {location && (
                                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <MapPin size={10} /> {location}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <AuctionCountdown endTime={a.auction_scheduled_end} />
                                                <span className="text-xs text-gray-400">LVR {lvr}%</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-bold text-gray-900">{formatCurrency(debt)}</p>
                                            <p className="text-xs text-gray-400">debt</p>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* My Recent Bids */}
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-indigo-500" />
                            <h2 className="text-sm font-bold text-gray-900">My Recent Bids</h2>
                        </div>
                        <button
                            onClick={() => navigate("/investor/my-bids")}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                        >
                            All bids <ChevronRight size={14} />
                        </button>
                    </div>
                    {recentBids.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <AlertCircle size={32} className="text-gray-200 mb-3" />
                            <p className="text-sm font-medium text-gray-500">No bids placed yet</p>
                            <button
                                onClick={() => navigate("/investor/auctions")}
                                className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
                            >
                                Browse auctions
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {recentBids.map((bid) => {
                                const badge = getBidStatusBadge(bid);
                                return (
                                    <div
                                        key={bid.id}
                                        onClick={() => navigate(`/investor/auctions/${bid.auction?.case_id || bid.case_id || bid.auction_id}`)}
                                        className="px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-semibold text-gray-900 truncate flex-1">
                                                {bid.auction?.property_address || bid.auction?.title || bid.property_address || `Bid #${String(bid.id || "").slice(0, 6)}`}
                                            </p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-sm font-bold text-gray-900">{formatCurrency(parseFloat(bid.amount) || 0)}</p>
                                            <p className="text-xs text-gray-400">
                                                {bid.created_at ? new Date(bid.created_at).toLocaleDateString("en-AU", { day: "2-digit", month: "short" }) : ""}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {recentBids.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-50">
                            <button
                                onClick={() => navigate("/investor/my-bids")}
                                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                View all bids <ArrowRight size={13} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick action bar */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-sm text-gray-500">Ready to invest? Browse live auctions now.</p>
                <button
                    onClick={() => navigate("/investor/auctions")}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                >
                    <Gavel size={13} /> Browse Auctions
                </button>
            </div>
        </div>
    );
}
