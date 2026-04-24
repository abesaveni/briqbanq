import { useState, useMemo, useEffect } from "react";
import LenderDealCard from "../../components/deals/LenderDealCard";
import { dealsService, casesService } from "../../api/dataService";
import { LoadingState, ErrorState, EmptyState } from "../../components/common/States";
import { SlidersHorizontal, X } from "lucide-react";

const DEFAULT_ADVANCED = { minLvr: '', maxLvr: '', minLoan: '', maxLoan: '', minBeds: '' };

function resolveImage(propertyImages, documents) {
    if (Array.isArray(propertyImages) && propertyImages.length > 0) return propertyImages[0];
    const imgDoc = (documents || []).find(doc =>
        (doc.document_type || doc.type) === 'Property Image' &&
        doc.file_url && !doc.file_url.startsWith('local://')
    );
    return imgDoc ? imgDoc.file_url : null;
}

function mapDealToCard(d) {
    const meta = d.metadata_json_case || d.metadata_json || {};
    const loanAmount = parseFloat(d.asking_price) || 0;
    const estimatedValue = parseFloat(d.estimated_value) || 0;
    const lvr = estimatedValue > 0 ? Math.round((loanAmount / estimatedValue) * 100) : 0;
    const returnRate = parseFloat(d.interest_rate) || 0;
    const dealStatusMap = {
        LISTED: "Active",
        UNDER_CONTRACT: "Buy Now",
        SETTLED: "Sold",
        CLOSED: "Sold",
        DRAFT: "Coming Soon",
    };
    const images = Array.isArray(d.property_images) && d.property_images.length > 0
        ? d.property_images
        : (meta.property_images || []);
    return {
        id: d.id,
        case_id: d.case_id,
        case_number: d.case_number || null,
        title: d.title || d.property_address || "Investment Property",
        status: dealStatusMap[d.status] || "Coming Soon",
        image: resolveImage(images, d.documents),
        suburb: d.suburb || meta.suburb || "",
        state: d.state || meta.state || "",
        postcode: d.postcode || meta.postcode || "",
        loanAmount,
        lvr,
        returnRate,
        expectedReturn: returnRate,
        tenure: d.tenure,
        equity: Math.max(0, estimatedValue - loanAmount),
        auctionEnd: d.auction_scheduled_end || null,
        currentBid: parseFloat(d.current_highest_bid) || 0,
        type: d.property_type || meta.property_type || "",
        bedrooms: meta.bedrooms ?? d.bedrooms ?? 0,
        bathrooms: meta.bathrooms ?? d.bathrooms ?? 0,
        parking: meta.parking ?? d.parking ?? 0,
    };
}

function mapCaseToDeal(c) {
    const meta = c.metadata_json || {};
    const loanAmount = parseFloat(c.outstanding_debt) || 0;
    const estimatedValue = parseFloat(c.estimated_value) || 0;
    const lvr = estimatedValue > 0 ? Math.round((loanAmount / estimatedValue) * 100) : 0;
    const returnRate = parseFloat(c.interest_rate) || 0;
    const images = Array.isArray(c.property_images) && c.property_images.length > 0
        ? c.property_images
        : (meta.property_images || []);
    let suburb = meta.suburb || c.suburb || "";
    let state = meta.state || c.state || "";
    let postcode = meta.postcode || c.postcode || "";
    if (!suburb && c.property_address) {
        const parts = c.property_address.split(",");
        if (parts.length >= 2) {
            const lastPart = parts[parts.length - 1].trim();
            const tokens = lastPart.split(" ").filter(Boolean);
            if (tokens.length >= 2 && /^\d{4}$/.test(tokens[tokens.length - 1])) {
                postcode = tokens[tokens.length - 1];
                state = tokens[tokens.length - 2];
                suburb = parts[parts.length - 2]?.trim() || "";
            } else {
                suburb = parts[parts.length - 2]?.trim() || "";
                state = lastPart;
            }
        }
    }
    return {
        id: c.id,
        case_id: c.id,
        case_number: c.case_number || null,
        title: c.title || c.property_address || "Investment Property",
        status: c.auction_status === "LIVE" ? "Live Auction"
            : c.auction_status === "SCHEDULED" ? "Coming Soon"
            : c.auction_status === "PAUSED" ? "Paused"
            : c.auction_status === "ENDED" ? "Ended"
            : c.status === "AUCTION" ? "Live Auction"
            : "Active",
        image: resolveImage(images, c.documents),
        suburb,
        state,
        postcode,
        loanAmount,
        lvr,
        returnRate,
        expectedReturn: returnRate,
        tenure: c.tenure,
        equity: Math.max(0, estimatedValue - loanAmount),
        auctionEnd: c.auction_scheduled_end || null,
        currentBid: parseFloat(c.current_highest_bid) || 0,
        type: c.property_type || meta.property_type || "",
        bedrooms: meta.bedrooms ?? c.bedrooms ?? 0,
        bathrooms: meta.bathrooms ?? c.bathrooms ?? 0,
        parking: meta.parking ?? c.parking ?? 0,
    };
}

export default function LenderAllDeals() {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedState, setSelectedState] = useState("All States");
    const [selectedStatus, setSelectedStatus] = useState("All Status");
    const [sortBy, setSortBy] = useState("Newest First");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [advanced, setAdvanced] = useState(DEFAULT_ADVANCED);

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                setLoading(true);
                setError(null);
                const [dealsRes, liveCasesRes] = await Promise.all([
                    dealsService.getDeals(),
                    casesService.getLiveListings(),
                ]);
                const dealItems = dealsRes.success
                    ? (Array.isArray(dealsRes.data) ? dealsRes.data : (dealsRes.data?.items || []))
                    : [];
                const liveItems = liveCasesRes.success
                    ? (Array.isArray(liveCasesRes.data) ? liveCasesRes.data : (liveCasesRes.data?.items || []))
                    : [];
                const mapped = dealItems.map(mapDealToCard);
                const dealCaseIds = new Set(mapped.map(d => String(d.case_id)));
                const liveMapped = liveItems.filter(c => !dealCaseIds.has(String(c.id))).map(mapCaseToDeal);
                setDeals([...mapped, ...liveMapped]);
            } catch (err) {
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };
        fetchDeals();
    }, []);

    const activeAdvancedCount = Object.values(advanced).filter(v => v !== '').length;

    const filteredDeals = useMemo(() => {
        let data = [...(deals || [])];

        if (search) {
            data = data.filter((deal) =>
                `${deal.title || ''} ${deal.suburb || ''} ${deal.postcode || ''}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
            );
        }

        if (selectedState !== "All States") {
            data = data.filter((deal) => deal.state === selectedState);
        }

        if (selectedStatus !== "All Status") {
            data = data.filter((deal) => deal.status === selectedStatus);
        }

        if (advanced.minLvr) data = data.filter(d => (d.lvr || 0) >= parseFloat(advanced.minLvr));
        if (advanced.maxLvr) data = data.filter(d => (d.lvr || 0) <= parseFloat(advanced.maxLvr));
        if (advanced.minLoan) data = data.filter(d => (d.loanAmount || 0) >= parseFloat(advanced.minLoan));
        if (advanced.maxLoan) data = data.filter(d => (d.loanAmount || 0) <= parseFloat(advanced.maxLoan));
        if (advanced.minBeds) data = data.filter(d => (d.bedrooms || 0) >= parseInt(advanced.minBeds));

        if (sortBy === "Price: Low to High") {
            data.sort((a, b) => (a.loanAmount || 0) - (b.loanAmount || 0));
        } else if (sortBy === "Price: High to Low") {
            data.sort((a, b) => (b.loanAmount || 0) - (a.loanAmount || 0));
        } else {
            // Newest First — default: sort by updated_at then created_at descending
            data.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
        }

        return data;
    }, [deals, search, selectedState, selectedStatus, sortBy, advanced]);

    const categorizedDeals = useMemo(() => {
        const auctions = filteredDeals.filter(d => d.status === "Live Auction");
        const buyNow = filteredDeals.filter(d => d.status === "Buy Now" || d.status === "Active");
        const upcoming = filteredDeals.filter(d => d.status === "Coming Soon");
        const sold = filteredDeals.filter(d => d.status === "Sold");

        return { auctions, buyNow, upcoming, sold };
    }, [filteredDeals]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <div className="space-y-5 animate-fade-in pb-6">
            <div>
                <h1 className="text-lg font-semibold text-slate-900">All Deals</h1>
                <p className="text-slate-500 text-sm">Monitor and participate in live lender auctions and acquisitions</p>
            </div>

            {/* FILTER BAR */}
            <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search by suburb, postcode or asset ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border border-gray-200 bg-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                </div>

                <div className="flex flex-wrap lg:flex-nowrap gap-3">
                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="border border-gray-200 bg-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium cursor-pointer min-w-[120px]"
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
                        className="border border-gray-200 bg-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium cursor-pointer min-w-[140px]"
                    >
                        <option>All Status</option>
                        <option>Live Auction</option>
                        <option>Coming Soon</option>
                        <option>Active</option>
                        <option>Buy Now</option>
                        <option>Sold</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border border-gray-200 bg-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium cursor-pointer min-w-[150px]"
                    >
                        <option>Newest First</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                    </select>

                    <button
                        onClick={() => setShowAdvancedFilters(p => !p)}
                        className={`relative flex items-center gap-2 border px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
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
            </div>

            {showAdvancedFilters && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3 bg-white/60">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <SlidersHorizontal size={14} className="text-indigo-600" />
                            Advanced Filters
                        </h3>
                        <div className="flex gap-3">
                            {activeAdvancedCount > 0 && (
                                <button onClick={() => setAdvanced(DEFAULT_ADVANCED)} className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors">
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
                            { key: 'minLoan', label: 'Min Loan (A$)', ph: '0' },
                            { key: 'maxLoan', label: 'Max Loan (A$)', ph: 'Any' },
                            { key: 'minBeds', label: 'Min Bedrooms', ph: '0' },
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
            </div>

            {/* CATEGORIZED VIEW */}
            {filteredDeals.length > 0 ? (
                <div className="space-y-8">
                    {categorizedDeals.auctions.length > 0 && (
                        <div className="space-y-6">
                            <SectionHeader
                                title="Live Recovery Auctions"
                                count={categorizedDeals.auctions.length}
                                color="text-red-600"
                                badgeColor="bg-red-50 text-red-600 border-red-100"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {categorizedDeals.auctions.map((deal) => (
                                    <LenderDealCard key={deal.id} deal={deal} />
                                ))}
                            </div>
                        </div>
                    )}

                    {categorizedDeals.buyNow.length > 0 && (
                        <div className="space-y-6">
                            <SectionHeader
                                title="Direct Acquisition (Buy Now)"
                                count={categorizedDeals.buyNow.length}
                                color="text-green-600"
                                badgeColor="bg-green-50 text-green-600 border-green-100"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {categorizedDeals.buyNow.map((deal) => (
                                    <LenderDealCard key={deal.id} deal={deal} />
                                ))}
                            </div>
                        </div>
                    )}

                    {categorizedDeals.upcoming.length > 0 && (
                        <div className="space-y-6">
                            <SectionHeader
                                title="Upcoming Opportunities"
                                count={categorizedDeals.upcoming.length}
                                color="text-blue-600"
                                badgeColor="bg-blue-50 text-blue-600 border-blue-100"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-90 transition-opacity hover:opacity-100">
                                {categorizedDeals.upcoming.map((deal) => (
                                    <LenderDealCard key={deal.id} deal={deal} />
                                ))}
                            </div>
                        </div>
                    )}

                    {categorizedDeals.sold.length > 0 && (
                        <div className="space-y-6">
                            <SectionHeader
                                title="Recovered Assets (Sold)"
                                count={categorizedDeals.sold.length}
                                color="text-slate-900"
                                badgeColor="bg-slate-100 text-slate-900 border-slate-200"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 grayscale-[0.5] opacity-80 hover:grayscale-0 hover:opacity-100 transition-all">
                                {categorizedDeals.sold.map((deal) => (
                                    <LenderDealCard key={deal.id} deal={deal} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full py-12 bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">No matching assets found</h3>
                    <p className="text-gray-400 text-sm max-w-sm">Adjust your filters or search terms to find available lender opportunities.</p>
                </div>
            )}
        </div>
    );
}

function SectionHeader({ title, count, color, badgeColor }) {
    return (
        <div className="flex items-center gap-4 pb-2">
            <h3 className={`text-lg font-semibold text-slate-900 tracking-tight`}>{title}</h3>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${badgeColor}`}>
                {count}
            </span>
            <div className="flex-1 h-[1px] bg-slate-100 ml-2"></div>
        </div>
    );
}
