import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auctionService } from '../../api/dataService';
import { formatCurrency } from '../../utils/formatters';
import { Gavel, Clock, TrendingUp, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder';

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Backend BidStatus enum: ACTIVE, OUTBID, WINNING, WON, LOST, DEFAULTED
// bid.auction_status comes from bid.auction.status (LIVE, ENDED, etc.)
function getBidStatus(bid) {
    const s = (bid.status || '').toUpperCase();
    const auctionEnded = (bid.auction_status || '').toUpperCase() === 'ENDED';
    if (s === 'WON') return { label: 'Won', cls: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' };
    if (s === 'DEFAULTED') return { label: 'Defaulted', cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
    if (s === 'LOST' || (auctionEnded && s === 'OUTBID')) return { label: 'Lost', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' };
    if (auctionEnded && s === 'WINNING') return { label: 'Won', cls: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' };
    if (s === 'WINNING') return { label: 'Winning', cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
    if (s === 'OUTBID') return { label: 'Outbid', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' };
    return { label: 'Active', cls: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' };
}

function CountdownBadge({ endTime }) {
    const [label, setLabel] = useState('');
    useEffect(() => {
        const update = () => {
            if (!endTime) { setLabel('—'); return; }
            const diff = new Date(endTime) - Date.now();
            if (diff <= 0) { setLabel('Ended'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setLabel(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [endTime]);
    if (!endTime) return null;
    const ended = new Date(endTime) <= Date.now();
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${ended ? 'text-gray-400' : 'text-amber-600'}`}>
            <Clock size={11} /> {ended ? 'Ended' : label}
        </span>
    );
}

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'winning', label: 'Winning' },
    { id: 'outbid', label: 'Outbid' },
    { id: 'won', label: 'Won' },
    { id: 'lost', label: 'Lost' },
];

export default function MyBidsPage({ role = 'investor' }) {
    const navigate = useNavigate();
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await auctionService.getMyBids();
            if (res.success) {
                const raw = Array.isArray(res.data) ? res.data : (res.data?.items || []);
                setBids(raw);
            } else {
                setError(res.error || 'Failed to load bids');
            }
        } catch (e) {
            if (e.response?.status !== 401) setError(e.message || 'Failed to load bids');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const auctionPath = (bid) => {
        const cid = bid.auction?.case_id || bid.case_id;
        return cid ? `/${role}/auctions/${cid}` : null;
    };

    const stats = {
        total: bids.length,
        winning: bids.filter(b => getBidStatus(b).label === 'Winning').length,
        outbid: bids.filter(b => getBidStatus(b).label === 'Outbid').length,
        won: bids.filter(b => getBidStatus(b).label === 'Won').length,
        lost: bids.filter(b => getBidStatus(b).label === 'Lost').length,
        totalValue: bids.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0),
    };

    const filtered = bids.filter(b => {
        if (filter === 'all') return true;
        const s = getBidStatus(b).label.toLowerCase();
        return s === filter;
    });

    return (
        <div className="space-y-5 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Bids</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track all your auction bids and their status</p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                    { label: 'Total Bids', value: stats.total, icon: Gavel, color: 'text-indigo-600' },
                    { label: 'Winning', value: stats.winning, icon: TrendingUp, color: 'text-emerald-600' },
                    { label: 'Outbid', value: stats.outbid, icon: AlertCircle, color: 'text-amber-600' },
                    { label: 'Won', value: stats.won, icon: CheckCircle2, color: 'text-blue-600' },
                    { label: 'Total Bid Value', value: formatCurrency(stats.totalValue), icon: null, color: 'text-gray-900' },
                ].map((s, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`px-3 py-2.5 text-sm font-medium transition-colors relative ${
                            filter === tab.id ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        {tab.label}
                        {filter === tab.id && (
                            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                    <RefreshCw size={18} className="animate-spin mr-2" /> Loading bids...
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 rounded-2xl py-10 text-center">
                    <p className="text-sm font-medium text-red-600">{error}</p>
                    <button onClick={load} className="mt-3 text-xs font-semibold text-indigo-600 hover:underline">Try again</button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-14 flex flex-col items-center gap-3">
                    <Gavel size={36} className="text-gray-200" />
                    <p className="text-sm font-medium text-gray-500">No {filter === 'all' ? '' : filter} bids found</p>
                    {filter === 'all' && (
                        <button
                            onClick={() => navigate(`/${role}/auctions`)}
                            className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                        >
                            Browse Auctions
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((bid) => {
                        const s = getBidStatus(bid);
                        const path = auctionPath(bid);
                        const property = bid.auction?.property_address || bid.auction?.title || bid.property_address || 'Investment Property';
                        const highestBid = bid.auction?.current_highest_bid;
                        const img = bid.auction?.property_images?.[0] || null;
                        const isWinning = s.label === 'Winning';
                        const isOutbid = s.label === 'Outbid';

                        return (
                            <div
                                key={bid.id}
                                className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group ${
                                    isWinning ? 'border-emerald-200' : isOutbid ? 'border-amber-200' : 'border-gray-100'
                                }`}
                                onClick={() => path && navigate(path)}
                            >
                                {/* Image strip */}
                                <div className="relative h-36 bg-gray-100 flex-shrink-0 overflow-hidden">
                                    <img
                                        src={img || PROPERTY_PLACEHOLDER}
                                        alt={property}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                    <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${isWinning ? 'animate-pulse' : ''}`} />
                                        {s.label}
                                    </span>
                                    {bid.auction?.scheduled_end && (
                                        <span className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                            <CountdownBadge endTime={bid.auction.scheduled_end} />
                                        </span>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{property}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{bid.auction?.case_number || fmtDate(bid.created_at)}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-3 border-y border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Your Bid</p>
                                            <p className={`text-sm font-bold ${isWinning ? 'text-emerald-600' : 'text-gray-900'}`}>
                                                {formatCurrency(parseFloat(bid.amount) || 0)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Highest Bid</p>
                                            <p className="text-sm font-semibold text-gray-700">
                                                {highestBid ? formatCurrency(parseFloat(highestBid)) : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-400">Placed {fmtDate(bid.created_at)}</p>
                                        {path && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(path); }}
                                                className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                                    isOutbid
                                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {isOutbid ? 'Bid Again' : 'View'}
                                                <ArrowRight size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
