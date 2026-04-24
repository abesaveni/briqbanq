import { useState, useMemo, useEffect } from "react";
import LenderAuctionCard from "../../components/auctions/LenderAuctionCard";
import AuctionFilters from "../../components/auctions/AuctionFilters";
import AuctionStats from "../../components/auctions/AuctionStats";
import { casesService } from "../../api/dataService";
import { LoadingState, ErrorState, EmptyState } from "../../components/common/States";

function resolveImage(propertyImages, documents) {
    if (Array.isArray(propertyImages) && propertyImages.length > 0) return propertyImages[0];
    const imgDoc = (documents || []).find(doc =>
        (doc.document_type || doc.type) === 'Property Image' &&
        doc.file_url && !doc.file_url.startsWith('local://')
    );
    return imgDoc ? imgDoc.file_url : null;
}

function mapCaseToAuction(c) {
    const meta = c.metadata_json || {};
    const outstandingDebt = parseFloat(c.outstanding_debt) || 0;
    const propertyValue = parseFloat(c.estimated_value) || 0;
    const lvr = propertyValue > 0 ? Math.round((outstandingDebt / propertyValue) * 100) : 0;
    const equity = propertyValue - outstandingDebt;
    const returnRate = parseFloat(c.interest_rate) || 0;

    const cardStatus = c.auction_status === "LIVE" ? "live"
        : c.auction_status === "ENDED" ? "ended"
        : c.auction_status === "PAUSED" ? "paused"
        : c.auction_status === "SCHEDULED" ? "upcoming"
        : c.status === "AUCTION" ? "upcoming"
        : "active";

    const images = Array.isArray(c.property_images) && c.property_images.length > 0
        ? c.property_images
        : (meta.property_images || []);

    const suburb = meta.suburb || c.suburb || "";
    const state = meta.state || c.state || "";
    const postcode = meta.postcode || c.postcode || "";

    return {
        id: c.id,
        case_number: c.case_number || null,
        title: c.title || c.property_address || "Investment Property",
        status: cardStatus,
        image: resolveImage(images, c.documents),
        suburb,
        state,
        postcode,
        outstandingDebt,
        propertyValue,
        lvr,
        equity,
        returnRate,
        expectedReturn: returnRate,
        currentBid: parseFloat(c.current_highest_bid) || 0,
        endTime: c.auction_scheduled_end || null,
        bedrooms: meta.bedrooms ?? c.bedrooms ?? 0,
        bathrooms: meta.bathrooms ?? c.bathrooms ?? 0,
        parking: meta.parking ?? c.parking ?? 0,
        bidders: c.bid_count || 0,
        defaultDays: parseInt(meta.days_in_default) || 0,
        arrearsDays: parseInt(meta.days_in_arrears) || parseInt(meta.days_in_default) || 0,
        totalArrears: parseFloat(meta.total_arrears) || 0,
        _raw: c,
    };
}

export default function LenderAuctions() {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortOption, setSortOption] = useState("newest");
    const [advancedFilters, setAdvancedFilters] = useState({ minLvr: '', maxLvr: '', minValue: '', maxValue: '', minBidders: '' });

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await casesService.getLiveListings();
                if (res.success) {
                    const raw = Array.isArray(res.data) ? res.data : (res.data?.items || []);
                    setAuctions(raw.map(mapCaseToAuction));
                } else {
                    setError(res.error || "Failed to load auctions.");
                }
            } catch (err) {
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };
        fetchAuctions();
    }, []);

    const filteredAuctions = useMemo(() => {
        let result = (auctions || []).filter((auction) => {
            const q = search.toLowerCase();
            const matchesSearch =
                !q ||
                auction.title?.toLowerCase().includes(q) ||
                auction.suburb?.toLowerCase().includes(q) ||
                auction.state?.toLowerCase().includes(q);

            const matchesStatus =
                filterStatus === "all" ||
                auction.status === filterStatus ||
                (filterStatus === "upcoming" && auction.status === "active");

            if (!matchesSearch || !matchesStatus) return false;

            if (advancedFilters.minLvr && (auction.lvr || 0) < parseFloat(advancedFilters.minLvr)) return false;
            if (advancedFilters.maxLvr && (auction.lvr || 0) > parseFloat(advancedFilters.maxLvr)) return false;
            if (advancedFilters.minValue && (auction.propertyValue || 0) < parseFloat(advancedFilters.minValue)) return false;
            if (advancedFilters.maxValue && (auction.propertyValue || 0) > parseFloat(advancedFilters.maxValue)) return false;
            if (advancedFilters.minBidders && (auction.bidders || 0) < parseInt(advancedFilters.minBidders)) return false;

            return true;
        });

        if (sortOption === "low-high") {
            result.sort((a, b) => (a.propertyValue || 0) - (b.propertyValue || 0));
        } else if (sortOption === "high-low") {
            result.sort((a, b) => (b.propertyValue || 0) - (a.propertyValue || 0));
        } else if (sortOption === "ending") {
            result.sort((a, b) => new Date(a.endTime || 0) - new Date(b.endTime || 0));
        } else {
            // Newest (default)
            result.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
        }

        return result;
    }, [auctions, search, filterStatus, sortOption, advancedFilters]);

    const categorizedAuctions = useMemo(() => {
        const live = filteredAuctions.filter(a => a.status === "live");
        const upcoming = filteredAuctions.filter(a => a.status === "active" || a.status === "upcoming");
        const sold = filteredAuctions.filter(a => a.status === "sold");

        return { live, upcoming, sold };
    }, [filteredAuctions]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    const isSearching = search || filterStatus !== "all";

    return (
        <div className="space-y-5 animate-fade-in pb-6">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Active Auctions</h1>
                    <p className="text-slate-500 text-sm">Institutional monitoring of live and upcoming distressed asset recovery</p>
                </div>
            </div>

            <AuctionStats auctions={auctions} />

            <AuctionFilters
                search={search}
                setSearch={setSearch}
                statusFilter={filterStatus}
                setStatusFilter={setFilterStatus}
                sortOption={sortOption}
                setSortOption={setSortOption}
                onAdvancedChange={setAdvancedFilters}
            />

            {filteredAuctions.length > 0 ? (
                <div className="space-y-8">
                    {/* 1. LIVE AUCTIONS */}
                    {(isSearching ? filteredAuctions : categorizedAuctions.live).length > 0 && (
                        <div className="space-y-6">
                            <SectionHeading
                                title={isSearching ? "Search Results" : "Live Recovery Auctions"}
                                count={(isSearching ? filteredAuctions : categorizedAuctions.live).length}
                                color="text-red-600"
                                badgeColor="bg-red-50 text-red-600 border-red-100"
                                isLive
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {(isSearching ? filteredAuctions : categorizedAuctions.live).map((auction) => (
                                    <LenderAuctionCard key={auction.id} auction={auction} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming and Sold only if not searching or if relevant items exist */}
                    {!isSearching && (
                        <>
                            {categorizedAuctions.upcoming.length > 0 && (
                                <div className="space-y-6">
                                    <SectionHeading
                                        title="Upcoming Opportunities"
                                        count={categorizedAuctions.upcoming.length}
                                        color="text-indigo-600"
                                        badgeColor="bg-indigo-50 text-indigo-600 border-indigo-100"
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-90 transition-opacity hover:opacity-100">
                                        {categorizedAuctions.upcoming.map((auction) => (
                                            <LenderAuctionCard key={auction.id} auction={auction} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {categorizedAuctions.sold.length > 0 && (
                                <div className="space-y-6">
                                    <SectionHeading
                                        title="Completed Recoveries (Sold)"
                                        count={categorizedAuctions.sold.length}
                                        color="text-slate-900"
                                        badgeColor="bg-slate-100 text-slate-900 border-slate-200"
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 grayscale-[0.5] opacity-80 hover:grayscale-0 hover:opacity-100 transition-all">
                                        {categorizedAuctions.sold.map((auction) => (
                                            <LenderAuctionCard key={auction.id} auction={auction} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="col-span-full w-full py-12 bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">No auctions matching your criteria</h3>
                    <p className="text-gray-400 text-sm max-w-sm">Adjust your filters or try a broader search term to discover more opportunities.</p>
                </div>
            )}

        </div>
    );
}

function SectionHeading({ title, count, color, badgeColor, isLive }) {
    return (
        <div className="flex items-center gap-4 pb-2">
            <h3 className={`text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-3`}>
                {isLive && <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]"></span>}
                {title}
            </h3>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${badgeColor}`}>
                {count}
            </span>
            <div className="flex-1 h-[1px] bg-slate-100 ml-2"></div>
        </div>
    );
}
