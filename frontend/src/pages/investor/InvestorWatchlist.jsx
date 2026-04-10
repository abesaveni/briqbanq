import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, ChevronRight, Bookmark, Eye, Trash2, Search } from 'lucide-react';

export default function InvestorWatchlist() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('investor_watchlist') || '[]');
        setItems(saved);
    }, []);

    const handleRemove = (id) => {
        const updated = items.filter(i => i.id !== id);
        setItems(updated);
        localStorage.setItem('investor_watchlist', JSON.stringify(updated));
    };

    const filtered = items.filter(i =>
        !search ||
        (i.title || i.property_address || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.id || '').toString().toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-[1240px] mx-auto px-6 py-6 animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">My Watchlist</h1>
                <p className="text-gray-500 text-sm font-medium">Investments you've saved for review</p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-8 font-bold uppercase tracking-wider">
                <Home size={14} />
                <ChevronRight size={14} className="opacity-50" />
                <Link to="/investor/dashboard" className="hover:text-indigo-600">Dashboard</Link>
                <ChevronRight size={14} className="opacity-50" />
                <span className="text-slate-900">Watchlist</span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Bookmark size={18} className="text-indigo-500" />
                        <h3 className="font-bold text-slate-900 text-base">Saved Investments ({filtered.length})</h3>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 font-medium"
                        />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <Bookmark size={40} className="mb-4 opacity-30" />
                        <p className="text-sm font-medium">
                            {items.length === 0 ? 'Your watchlist is empty.' : 'No results match your search.'}
                        </p>
                        {items.length === 0 && (
                            <p className="text-xs mt-1">
                                Select investments from{' '}
                                <button onClick={() => navigate('/investor/dashboard')} className="text-indigo-600 hover:underline font-semibold">
                                    Active Investments
                                </button>{' '}
                                and click "Add to Watchlist".
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-50">
                                <tr>
                                    <th className="px-6 py-4">Case ID</th>
                                    <th className="px-6 py-4">Property</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Value</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.case_number || item.id}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                            {item.title || item.property_address || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-md border border-indigo-100 uppercase tracking-tighter">
                                                {item.status || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                            {item.estimated_value
                                                ? `$${Number(item.estimated_value).toLocaleString('en-AU')}`
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => navigate(`/investor/case-details/${item.id}`)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="View"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleRemove(item.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Remove from watchlist"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
