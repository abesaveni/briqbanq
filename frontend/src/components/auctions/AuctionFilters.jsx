import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const DEFAULT_ADVANCED = { minLvr: '', maxLvr: '', minValue: '', maxValue: '', minBidders: '' };

const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

export default function AuctionFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  sortOption,
  setSortOption,
  stateFilter,
  setStateFilter,
  onAdvancedChange,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advanced, setAdvanced] = useState(DEFAULT_ADVANCED);

  const update = (key, val) => {
    const next = { ...advanced, [key]: val };
    setAdvanced(next);
    onAdvancedChange?.(next);
  };

  const reset = () => {
    setAdvanced(DEFAULT_ADVANCED);
    onAdvancedChange?.(DEFAULT_ADVANCED);
  };

  const activeCount = Object.values(advanced).filter(v => v !== '').length;

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
        <input
          type="text"
          placeholder="Search by suburb, address or property type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Status</option>
          <option value="live">Live Now</option>
          <option value="upcoming">Upcoming</option>
          <option value="ended">Ended</option>
        </select>

        {setStateFilter && (
          <select
            value={stateFilter || 'all'}
            onChange={(e) => setStateFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All States</option>
            {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="newest">Newest First</option>
          <option value="ending">Ending Soon</option>
          <option value="low-high">Price: Low to High</option>
          <option value="high-low">Price: High to Low</option>
        </select>

        <button
          onClick={() => setShowAdvanced(p => !p)}
          className={`relative flex items-center gap-2 border px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
            showAdvanced || activeCount > 0
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal size={14} />
          Advanced Filters
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {showAdvanced && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-indigo-600" />
              Advanced Filters
            </h3>
            <div className="flex gap-3">
              {activeCount > 0 && (
                <button onClick={reset} className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors">
                  <X size={12} /> Reset
                </button>
              )}
              <button onClick={() => setShowAdvanced(false)} className="text-xs text-gray-400 hover:text-gray-600">
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Min LVR (%)</label>
              <input
                type="number"
                placeholder="0"
                value={advanced.minLvr}
                onChange={(e) => update('minLvr', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Max LVR (%)</label>
              <input
                type="number"
                placeholder="Any"
                value={advanced.maxLvr}
                onChange={(e) => update('maxLvr', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Min Value (A$)</label>
              <input
                type="number"
                placeholder="0"
                value={advanced.minValue}
                onChange={(e) => update('minValue', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Max Value (A$)</label>
              <input
                type="number"
                placeholder="Any"
                value={advanced.maxValue}
                onChange={(e) => update('maxValue', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Min Bidders</label>
              <input
                type="number"
                placeholder="0"
                value={advanced.minBidders}
                onChange={(e) => update('minBidders', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
