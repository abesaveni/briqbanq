import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auctionService } from '../../api/dataService';
import { useAuth } from '../../context/AuthContext';

const fmt = (n) =>
    n != null
        ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(Number(n))
        : '—';

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function getBidStatus(bid) {
    const auctionEnded = bid.auction_status === 'ENDED' || bid.auction_status === 'ended';
    if (bid.status === 'WON' || bid.status === 'won') return { label: 'Won', cls: 'bg-emerald-100 text-emerald-700' };
    if (bid.status === 'DEFAULTED') return { label: 'Defaulted', cls: 'bg-red-100 text-red-700' };
    if (auctionEnded && (bid.status === 'OUTBID' || bid.status === 'outbid')) return { label: 'Lost', cls: 'bg-gray-100 text-gray-500' };
    if (auctionEnded && bid.status === 'WINNING') return { label: 'Won', cls: 'bg-emerald-100 text-emerald-700' };
    if (bid.status === 'WINNING' || bid.status === 'winning') return { label: 'Winning', cls: 'bg-green-100 text-green-700' };
    if (bid.status === 'OUTBID' || bid.status === 'outbid') return { label: 'Outbid', cls: 'bg-red-100 text-red-600' };
    return { label: bid.status || 'Active', cls: 'bg-blue-100 text-blue-700' };
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
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${ended ? 'bg-gray-100 text-gray-400' : 'bg-amber-50 text-amber-600'}`}>
            {ended ? 'Ended' : `⏱ ${label}`}
        </span>
    );
}

export default function MyBidsPage({ role = 'investor' }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await auctionService.getMyBids();
            if (res.success) setBids(res.data || []);
            else setError(res.error || 'Failed to load bids');
        } catch (e) {
            setError(e.message || 'Failed to load bids');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const auctionPath = (bid) => {
        const cid = bid.auction?.case_id || bid.case_id;
        if (!cid) return null;
        return `/${role}/auctions/${cid}`;
    };

    const filtered = bids.filter(b => {
        if (filter === 'all') return true;
        const s = getBidStatus(b);
        if (filter === 'winning') return s.label === 'Winning';
        if (filter === 'outbid') return s.label === 'Outbid';
        if (filter === 'won') return s.label === 'Won';
        if (filter === 'lost') return s.label === 'Lost';
        return true;
    });

    const stats = {
        total: bids.length,
        winning: bids.filter(b => getBidStatus(b).label === 'Winning').length,
        outbid: bids.filter(b => getBidStatus(b).label === 'Outbid').length,
        won: bids.filter(b => getBidStatus(b).label === 'Won').length,
    };

    return (
        <div className="space-y-5 pb-6">
            <div>
                <h1 className="text-lg font-semibold text-slate-900">My Bids</h1>
                <p className="text-sm text-slate-500">All auctions you have bid on</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Bids', value: stats.total, color: 'text-slate-900' },
                    { label: 'Currently Winning', value: stats.winning, color: 'text-green-600' },
                    { label: 'Outbid', value: stats.outbid, color: 'text-red-600' },
                    { label: 'Won', value: stats.won, color: 'text-emerald-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-xs text-gray-500">{s.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'winning', label: 'Winning' },
                    { id: 'outbid', label: 'Outbid' },
                    { id: 'won', label: 'Won' },
                    { id: 'lost', label: 'Lost' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`px-3 py-2 text-sm font-medium transition-colors relative ${filter === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        {tab.label}
                        {filter === tab.id && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600" />}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                    <svg className="w-5 h-5 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Loading bids...
                </div>
            ) : error ? (
                <div className="py-10 text-center text-red-500 text-sm">{error}</div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-200 py-14 flex flex-col items-center gap-3">
                    <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <p className="text-sm font-medium text-gray-400">No bids found</p>
                    <p className="text-xs text-gray-300">{filter === 'all' ? "You haven't placed any bids yet. Browse auctions to get started." : `No ${filter} bids.`}</p>
                    {filter === 'all' && (
                        <button
                            onClick={() => navigate(`/${role}/auctions`)}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
                        >
                            Browse Auctions
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Your Bid</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Highest Bid</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Auction Ends</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bid Placed</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((bid) => {
                                    const s = getBidStatus(bid);
                                    const path = auctionPath(bid);
                                    const property = bid.auction?.property_address || bid.auction?.title || bid.property_address || '—';
                                    const highestBid = bid.auction?.current_highest_bid;
                                    const isWinning = s.label === 'Winning';
                                    return (
                                        <tr key={bid.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-gray-900 text-sm">{property}</p>
                                                <p className="text-xs text-gray-400">{bid.auction?.case_number || ''}</p>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className={`font-bold ${isWinning ? 'text-green-600' : 'text-gray-900'}`}>{fmt(bid.amount)}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="font-semibold text-gray-700">{fmt(highestBid)}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <CountdownBadge endTime={bid.auction?.scheduled_end} />
                                            </td>
                                            <td className="px-4 py-4 text-xs text-gray-400">{fmtDate(bid.created_at)}</td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>
                                                    {s.label === 'Winning' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                                                    {s.label === 'Outbid' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                                                    {s.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {path && (
                                                    <button
                                                        onClick={() => navigate(path)}
                                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                                    >
                                                        {s.label === 'Outbid' ? 'Bid Again →' : 'View →'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
