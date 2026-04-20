import { useState, useEffect, useCallback } from "react";
import { Gavel, Trophy, RefreshCw, CheckCircle, AlertCircle, Plus, Minus } from "lucide-react";
import { auctionService } from "../../api/dataService";
import { formatCurrency } from "../../utils/formatters";

const fmt = (n) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

/**
 * CaseBidPanel — shared across all roles.
 * Props:
 *  caseId     : string — the case UUID
 *  canBid     : bool   — show bid placement form (investor/lender/lawyer/admin)
 *  canClose   : bool   — show "Accept & Close" button (admin only)
 *  currentUser: { name, role }
 */
export default function CaseBidPanel({ caseId, canBid = false, canClose = false, currentUser = {} }) {
    const [bids, setBids] = useState([]);
    const [auction, setAuction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bidAmount, setBidAmount] = useState("");
    const [placing, setPlacing] = useState(false);
    const [closing, setClosing] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // silent=true skips the loading spinner so existing bids stay visible during refresh
    const fetchBids = useCallback(async (silent = false) => {
        if (!caseId) return;
        try {
            if (silent) setRefreshing(true); else setLoading(true);
            const [bidsRes, auctionRes] = await Promise.all([
                auctionService.getBidsByCase(caseId),
                auctionService.getAuctionsByCase(caseId),
            ]);
            if (bidsRes.success) {
                const raw = Array.isArray(bidsRes.data) ? bidsRes.data : [];
                const sorted = [...raw].sort((a, b) => Number(b.amount) - Number(a.amount));
                setBids(sorted);
            }
            if (auctionRes.success) {
                const arr = Array.isArray(auctionRes.data) ? auctionRes.data : (auctionRes.data?.items || []);
                setAuction(arr[0] || null);
            }
        } catch {
            // silent — no bids yet is fine
        } finally {
            if (silent) setRefreshing(false); else setLoading(false);
        }
    }, [caseId]);

    useEffect(() => { fetchBids(); }, [fetchBids]);

    // Auto-refresh every 15 seconds silently so bid history stays live
    useEffect(() => {
        if (!caseId) return;
        const interval = setInterval(() => fetchBids(true), 15000);
        return () => clearInterval(interval);
    }, [fetchBids, caseId]);

    const winningBid = bids[0] || null;
    const isLive = auction?.status === "LIVE";
    const minBid = winningBid
        ? Number(winningBid.amount) + Number(auction?.minimum_increment || 10000)
        : Number(auction?.starting_price || 0);

    const handlePlaceBid = async () => {
        const amount = parseFloat(bidAmount.replace(/,/g, ""));
        if (!amount || amount < minBid) {
            showToast(`Bid must be at least ${fmt(minBid)}`, "error");
            return;
        }
        if (!auction?.id) {
            showToast("No active auction for this case", "error");
            return;
        }
        setPlacing(true);
        try {
            const res = await auctionService.placeBid(auction.id, amount);
            if (res.success) {
                showToast(`Bid of ${fmt(amount)} placed successfully`);
                // Optimistic update — show the new bid immediately without blanking the list
                const optimisticBid = {
                    id: `optimistic-${Date.now()}`,
                    amount,
                    bidder_name: currentUser?.name || "You",
                    created_at: new Date().toISOString(),
                    status: "ACTIVE",
                };
                setBids(prev => {
                    const updated = [optimisticBid, ...prev.filter(b => !b.id?.toString().startsWith("optimistic-"))];
                    return updated.sort((a, b) => Number(b.amount) - Number(a.amount));
                });
                setBidAmount("");
                // Background refresh to replace optimistic data with server truth
                fetchBids(true);
            } else {
                showToast(res.error || "Failed to place bid", "error");
            }
        } catch (err) {
            showToast(err.message || "An error occurred", "error");
        } finally {
            setPlacing(false);
        }
    };

    const handleCloseBid = async () => {
        if (!winningBid?.id) return;
        if (!window.confirm(`Accept bid of ${fmt(winningBid.amount)} from ${winningBid.bidder_name || "Bidder"}? This will close the auction.`)) return;
        setClosing(true);
        try {
            const res = await auctionService.approveBid(winningBid.id);
            if (res.success) {
                showToast("Bid accepted — auction closed successfully");
                await fetchBids();
            } else {
                showToast(res.error || "Failed to close bid", "error");
            }
        } catch (err) {
            showToast(err.message || "An error occurred", "error");
        } finally {
            setClosing(false);
        }
    };

    const adjust = (delta) => {
        const current = parseFloat(bidAmount.replace(/,/g, "")) || minBid;
        const next = Math.max(minBid, current + delta);
        setBidAmount(next.toLocaleString("en-AU"));
    };

    return (
        <div className="space-y-4">
            {/* Toast */}
            {toast && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${toast.type === "error" ? "bg-red-50 border border-red-100 text-red-700" : "bg-emerald-50 border border-emerald-100 text-emerald-700"}`}>
                    {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Total Bids</p>
                    <p className="text-xl font-black text-indigo-700 mt-0.5">{bids.length}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">Highest Bid</p>
                    <p className="text-lg font-black text-amber-700 mt-0.5">{winningBid ? fmt(winningBid.amount) : "—"}</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${isLive ? "bg-green-50" : "bg-gray-50"}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isLive ? "text-green-500" : "text-gray-400"}`}>Status</p>
                    <p className={`text-sm font-black mt-0.5 ${isLive ? "text-green-700" : "text-gray-500"}`}>{auction?.status || "No Auction"}</p>
                </div>
            </div>

            {/* Accepted Bid Banner — shown to all roles when auction is closed */}
            {auction?.status === "ENDED" && winningBid && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <CheckCircle size={16} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-emerald-800">Bid Accepted</p>
                            <p className="text-xs text-emerald-600">This auction has been closed</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white rounded-xl p-3 border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Accepted Price</p>
                            <p className="text-xl font-black text-emerald-800 mt-0.5">{fmt(winningBid.amount)}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Winning Bidder</p>
                            <p className="text-sm font-bold text-emerald-800 mt-0.5 truncate">{winningBid.bidder_name || "—"}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-emerald-100 col-span-2">
                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Accepted On</p>
                            <p className="text-sm font-bold text-emerald-800 mt-0.5">{fmtDate(winningBid.updated_at || winningBid.created_at)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Bid Placement Form */}
            {canBid && isLive && (
                <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Place a Bid</p>
                    <p className="text-xs text-gray-400">Minimum bid: <span className="text-indigo-600 font-bold">{fmt(minBid)}</span></p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => adjust(-10000)} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
                            <Minus size={14} />
                        </button>
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">A$</span>
                            <input
                                type="text"
                                value={bidAmount}
                                onChange={e => setBidAmount(e.target.value)}
                                placeholder={minBid.toLocaleString("en-AU")}
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                            />
                        </div>
                        <button onClick={() => adjust(10000)} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
                            <Plus size={14} />
                        </button>
                    </div>
                    <button
                        onClick={handlePlaceBid}
                        disabled={placing}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        <Gavel size={16} />
                        {placing ? "Placing Bid..." : "Place Bid"}
                    </button>
                </div>
            )}

            {/* Accept / Close Bid */}
            {canClose && winningBid && auction?.status !== "ENDED" && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Winning Bid</p>
                            <p className="text-lg font-black text-emerald-800 mt-0.5">{fmt(winningBid.amount)}</p>
                            <p className="text-xs text-emerald-600 mt-0.5">{winningBid.bidder_name || "Bidder"}</p>
                        </div>
                        <button
                            onClick={handleCloseBid}
                            disabled={closing}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 disabled:opacity-60"
                        >
                            <CheckCircle size={16} />
                            {closing ? "Closing..." : "Accept & Close"}
                        </button>
                    </div>
                </div>
            )}

            {/* Bid History */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Gavel size={16} className="text-indigo-500" />
                        <span className="text-sm font-bold text-gray-800">Bid History</span>
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full">{bids.length}</span>
                    </div>
                    <button onClick={() => fetchBids(true)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    </button>
                </div>

                {loading ? (
                    <div className="py-10 text-center text-sm text-gray-400">Loading bids...</div>
                ) : bids.length === 0 ? (
                    <div className="py-10 text-center">
                        <Gavel size={28} className="text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400 font-medium">No bids placed yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {bids.map((bid, i) => (
                            <div key={bid.id || i} className={`flex items-center justify-between px-4 py-3.5 ${i === 0 ? "bg-amber-50/40" : ""}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>
                                        {(bid.bidder_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-bold text-gray-900">{bid.bidder_name || "Bidder"}</p>
                                            {i === 0 && <Trophy size={12} className="text-amber-500" />}
                                            {currentUser?.name && bid.bidder_name === currentUser.name && (
                                                <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">You</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400">{fmtDate(bid.created_at)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-black ${i === 0 ? "text-emerald-600" : "text-gray-700"}`}>{fmt(bid.amount)}</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i === 0 ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                        {i === 0 ? (auction?.status === "ENDED" ? "Won" : "Winning") : "Outbid"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
