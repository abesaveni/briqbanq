import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Eye, Trash2, Search, MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import { PROPERTY_PLACEHOLDER } from '../../utils/propertyPlaceholder';
import { formatCurrency } from '../../utils/formatters';

export default function InvestorWatchlist() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('investor_watchlist') || '[]');
            setItems(Array.isArray(saved) ? saved : []);
        } catch {
            setItems([]);
        }
    }, []);

    const handleRemove = (id) => {
        const updated = items.filter(i => i.id !== id);
        setItems(updated);
        localStorage.setItem('investor_watchlist', JSON.stringify(updated));
    };

    const filtered = items.filter(i =>
        !search ||
        (i.title || i.property_address || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.suburb || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.state || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5 pb-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Watchlist</h1>
                <p className="text-sm text-gray-500 mt-0.5">Auctions you've saved to watch</p>
            </div>

            {/* Search + count */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <Bookmark size={16} className="text-indigo-500" />
                    <span className="text-sm font-semibold text-gray-700">{filtered.length} saved</span>
                </div>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search watchlist..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 placeholder:text-gray-400 w-56"
                    />
                </div>
            </div>

            {/* Cards */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 flex flex-col items-center gap-3">
                    <Bookmark size={36} className="text-gray-200" />
                    <p className="text-sm font-medium text-gray-500">
                        {items.length === 0 ? 'Your watchlist is empty' : 'No results match your search'}
                    </p>
                    {items.length === 0 && (
                        <p className="text-xs text-gray-400">
                            Browse auctions and click{' '}
                            <span className="font-semibold">Add to Watchlist</span>{' '}
                            to save them here.
                        </p>
                    )}
                    <button
                        onClick={() => navigate('/investor/auctions')}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Browse Auctions
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map(item => {
                        const images = Array.isArray(item.property_images) ? item.property_images : [];
                        const img = images[0] || item.image || null;
                        const location = [item.suburb, item.state, item.postcode].filter(Boolean).join(', ');
                        const val = parseFloat(item.estimated_value || item.propertyValue) || 0;
                        const debt = parseFloat(item.outstanding_debt || item.outstandingDebt) || 0;
                        const lvr = val > 0 ? Math.round((debt / val) * 100) : 0;
                        const rate = parseFloat(item.interest_rate || item.returnRate) || 0;

                        return (
                            <div
                                key={item.id}
                                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                                onClick={() => navigate(`/investor/auctions/${item.id}`)}
                            >
                                {/* Image */}
                                <div className="relative h-44 bg-gray-100 overflow-hidden">
                                    <img
                                        src={img || PROPERTY_PLACEHOLDER}
                                        alt={item.title || 'Property'}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                    <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-700">
                                        <Bookmark size={10} className="mr-1" /> Watching
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title || item.property_address || 'Investment Property'}</p>
                                        {location && (
                                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                <MapPin size={10} /> {location}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 py-3 border-y border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Property Value</p>
                                            <p className="text-sm font-semibold text-gray-900">{val ? formatCurrency(val) : '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Outstanding Debt</p>
                                            <p className="text-sm font-semibold text-gray-900">{debt ? formatCurrency(debt) : '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">LVR</p>
                                            <p className="text-sm font-semibold text-indigo-600">{lvr}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Return Rate</p>
                                            <p className="text-sm font-semibold text-emerald-600 flex items-center gap-0.5">
                                                <TrendingUp size={11} /> {rate}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                                            className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-rose-600 transition-colors"
                                        >
                                            <Trash2 size={12} /> Remove
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/investor/auctions/${item.id}`); }}
                                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                        >
                                            View <ArrowRight size={11} />
                                        </button>
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
