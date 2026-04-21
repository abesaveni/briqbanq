import { useState, useMemo, useEffect, useCallback } from "react";
import AdminDealCard from "../../components/deals/AdminDealCard";
import { dealsService, auctionService } from "../../api/dataService";
import { LoadingState, ErrorState, EmptyState } from "../../components/common/States";
import { SlidersHorizontal, X } from "lucide-react";

// Derive a smart display status from deal + case + auction status
function getDisplayStatus(d) {
    const deal = d.status  // backend DealStatus: DRAFT, LISTED, UNDER_CONTRACT, SETTLED, CLOSED
    const auction = d.auction_status  // AuctionStatus: LIVE, SCHEDULED, PAUSED, ENDED
    const caseStatus = d.case_status  // CaseStatus: LISTED, AUCTION, etc.

    if (deal === 'UNDER_CONTRACT') return 'Under Contract'
    if (deal === 'SETTLED') return 'Settled'
    if (deal === 'CLOSED') return 'Closed'

    if (deal === 'LISTED') {
        if (auction === 'LIVE') return 'Live Auction'
        if (auction === 'SCHEDULED') return 'Coming Soon'
        if (auction === 'PAUSED') return 'Paused'
        if (auction === 'ENDED') return 'Ended'
        return 'Listed'
    }

    if (deal === 'DRAFT') {
        if (caseStatus === 'AUCTION') return 'Draft (In Auction)'
        if (caseStatus === 'LISTED') return 'Draft (Listed)'
        return 'Draft'
    }

    return d.status || 'Unknown'
}

function normalizeDeal(d) {
    const asking = Number(d.asking_price) || 0
    const estimated = Number(d.estimated_value) || 0

    // Build property_images list from all sources
    let property_images = d.property_images || [];
    if (typeof property_images === 'string') {
        try { property_images = JSON.parse(property_images) } catch (e) { property_images = [] }
    }
    if (property_images.length === 0 && d.metadata_json_case?.property_images) {
        property_images = d.metadata_json_case.property_images;
    }

    // Use property_images first (proper /uploads/... URLs).
    // Fall back to documents only if the file_url is a real URL (not local:// stub).
    let finalImage = property_images[0] || null;
    if (!finalImage) {
        const imgDoc = (d.documents || []).find(doc =>
            (doc.document_type || doc.type) === 'Property Image' &&
            doc.file_url && !doc.file_url.startsWith('local://')
        );
        finalImage = imgDoc ? imgDoc.file_url : null;
    }

    const meta = d.metadata_json_case || {};

    return {
        ...d,
        status: getDisplayStatus(d),
        dealStatus: d.status,
        case_number: d.case_number || null,
        auction_status: d.auction_status || null,
        case_status: d.case_status || null,
        loanAmount: asking,
        buyNowPrice: asking,
        type: d.property_type || meta.property_type || 'Property',
        lvr: estimated > 0 ? Math.round((asking / estimated) * 100) : 0,
        returnRate: Number(d.interest_rate) || Number(meta.interest_rate) || 0,
        bedrooms: meta.bedrooms || d.bedrooms || 0,
        bathrooms: meta.bathrooms || d.bathrooms || 0,
        parking: meta.parking || d.parking || 0,
        image: finalImage,
        totalBids: d.total_bids || 0,
        currentBid: Number(d.current_highest_bid) || 0,
    }
}

const PROPERTY_TYPES = ['House', 'Apartment', 'Townhouse', 'Unit', 'Land', 'Commercial', 'Other']
const BEDROOM_OPTIONS = [{ label: 'Any', value: 0 }, { label: '1+', value: 1 }, { label: '2+', value: 2 }, { label: '3+', value: 3 }, { label: '4+', value: 4 }]

const DEFAULT_ADVANCED = {
    propertyTypes: [],
    minLvr: '',
    maxLvr: '',
    minLoan: '',
    maxLoan: '',
    minBeds: 0,
    auctionTypes: [],
}

export default function AdminAllDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dealsService.getDeals();
      if (res.success) {
        const raw = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        const scheduledAuctionIds = raw
          .filter(d => d.auction_status === 'SCHEDULED' && d.auction_id)
          .map(d => d.auction_id);
        if (scheduledAuctionIds.length > 0) {
          await Promise.allSettled(scheduledAuctionIds.map(id => auctionService.startAuction(id)));
          const res2 = await dealsService.getDeals();
          const raw2 = res2.success ? (Array.isArray(res2.data) ? res2.data : (res2.data?.items || [])) : raw;
          setDeals(raw2.map(normalizeDeal));
          return;
        }
        setDeals(raw.map(normalizeDeal));
      } else {
        setError(res.error || "Failed to load deals.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("All States");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("Newest");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advanced, setAdvanced] = useState(DEFAULT_ADVANCED);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const togglePropertyType = (type) => {
    setAdvanced(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter(t => t !== type)
        : [...prev.propertyTypes, type]
    }))
  }

  const toggleAuctionType = (type) => {
    setAdvanced(prev => ({
      ...prev,
      auctionTypes: prev.auctionTypes.includes(type)
        ? prev.auctionTypes.filter(t => t !== type)
        : [...prev.auctionTypes, type]
    }))
  }

  const resetAdvanced = () => setAdvanced(DEFAULT_ADVANCED)

  const activeAdvancedCount = [
    advanced.propertyTypes.length > 0,
    advanced.minLvr !== '' || advanced.maxLvr !== '',
    advanced.minLoan !== '' || advanced.maxLoan !== '',
    advanced.minBeds > 0,
    advanced.auctionTypes.length > 0,
  ].filter(Boolean).length

  const filteredDeals = useMemo(() => {
    let data = [...(deals || [])];

    if (search) {
      data = data.filter((deal) =>
        `${deal.title || ''} ${deal.suburb || ''} ${deal.postcode || ''}`
          .toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedState !== "All States") {
      data = data.filter((deal) => deal.state === selectedState);
    }

    if (selectedStatus !== "All Status") {
      data = data.filter((deal) => deal.status === selectedStatus);
    }

    // Advanced filters
    if (advanced.propertyTypes.length > 0) {
      data = data.filter(d => advanced.propertyTypes.some(t => (d.type || '').toLowerCase().includes(t.toLowerCase())))
    }
    if (advanced.minLvr !== '') {
      data = data.filter(d => d.lvr >= Number(advanced.minLvr))
    }
    if (advanced.maxLvr !== '') {
      data = data.filter(d => d.lvr <= Number(advanced.maxLvr))
    }
    if (advanced.minLoan !== '') {
      data = data.filter(d => d.loanAmount >= Number(advanced.minLoan))
    }
    if (advanced.maxLoan !== '') {
      data = data.filter(d => d.loanAmount <= Number(advanced.maxLoan))
    }
    if (advanced.minBeds > 0) {
      data = data.filter(d => (d.bedrooms || 0) >= advanced.minBeds)
    }
    if (advanced.auctionTypes.length > 0) {
      data = data.filter(d => advanced.auctionTypes.includes(d.status))
    }

    if (sortBy === "Price: Low to High") {
      data.sort((a, b) => (a.loanAmount || 0) - (b.loanAmount || 0));
    }
    if (sortBy === "Price: High to Low") {
      data.sort((a, b) => (b.loanAmount || 0) - (a.loanAmount || 0));
    }

    return data;
  }, [deals, search, selectedState, selectedStatus, sortBy, advanced]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">All Deals</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage platform deals across auctions and buy now opportunities.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search suburb, postcode or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 bg-white px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm pr-8"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap gap-2">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="border border-gray-200 bg-white px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm cursor-pointer"
          >
            <option>All States</option>
            <option>VIC</option>
            <option>NSW</option>
            <option>QLD</option>
            <option>WA</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-200 bg-white px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm cursor-pointer"
          >
            <option>All Status</option>
            <option>Draft</option>
            <option>Listed</option>
            <option>Live Auction</option>
            <option>Coming Soon</option>
            <option>Under Contract</option>
            <option>Settled</option>
            <option>Closed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 bg-white px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm cursor-pointer"
          >
            <option>Newest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>

          <button
            onClick={() => setShowAdvancedFilters(p => !p)}
            className={`relative flex items-center gap-1.5 border px-3 py-1.5 rounded text-sm font-semibold transition-colors whitespace-nowrap ${
              showAdvancedFilters || activeAdvancedCount > 0
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            Advanced Filters
            {activeAdvancedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {activeAdvancedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ADVANCED FILTERS PANEL */}
      {showAdvancedFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-indigo-600" />
              Advanced Filters
            </h3>
            <div className="flex items-center gap-3">
              {activeAdvancedCount > 0 && (
                <button onClick={resetAdvanced} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                  Clear all ({activeAdvancedCount})
                </button>
              )}
              <button onClick={() => setShowAdvancedFilters(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Property Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Property Type</label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => togglePropertyType(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      advanced.propertyTypes.includes(type)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* LVR Range */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">LVR Range (%)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={advanced.minLvr}
                  onChange={e => setAdvanced(p => ({ ...p, minLvr: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  min={0} max={100}
                />
                <span className="text-gray-400 text-xs">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={advanced.maxLvr}
                  onChange={e => setAdvanced(p => ({ ...p, maxLvr: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  min={0} max={100}
                />
              </div>
            </div>

            {/* Loan Amount Range */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Loan Amount (AUD)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={advanced.minLoan}
                  onChange={e => setAdvanced(p => ({ ...p, minLoan: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  min={0}
                />
                <span className="text-gray-400 text-xs">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={advanced.maxLoan}
                  onChange={e => setAdvanced(p => ({ ...p, maxLoan: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  min={0}
                />
              </div>
            </div>

            {/* Bedrooms + Auction Type */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Min Bedrooms</label>
                <div className="flex gap-1">
                  {BEDROOM_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAdvanced(p => ({ ...p, minBeds: opt.value }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        advanced.minBeds === opt.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Listing Type</label>
                <div className="flex flex-wrap gap-2">
                  {['Live Auction', 'Coming Soon', 'Listed', 'Under Contract'].map(type => (
                    <button
                      key={type}
                      onClick={() => toggleAuctionType(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        advanced.auctionTypes.includes(type)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDeals.length > 0 ? (
          filteredDeals.map((deal) => (
            <AdminDealCard key={deal.id} deal={deal} onRefresh={fetchDeals} />
          ))
        ) : (
          <div className="col-span-full w-full">
            <EmptyState
              message="No deals found"
              submessage="Try searching for a different suburb or adjusting your filters."
            />
          </div>
        )}
      </div>
    </div>
  );
}
