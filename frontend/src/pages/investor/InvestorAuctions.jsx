import { useState, useMemo, useEffect } from "react";
import InvestorAuctionCard from "../../components/auctions/InvestorAuctionCard";
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

export default function InvestorAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOption, setSortOption] = useState("ending");
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
        if (err.response?.status !== 401) {
          setError(err.message || "An unexpected error occurred.");
        }
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
    }

    if (sortOption === "high-low") {
      result.sort((a, b) => (b.propertyValue || 0) - (a.propertyValue || 0));
    }

    if (sortOption === "ending") {
      result.sort(
        (a, b) => new Date(a.endTime || 0) - new Date(b.endTime || 0)
      );
    }

    return result;
  }, [auctions, search, filterStatus, sortOption, advancedFilters]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (

    <div className="space-y-8">

      <div className="mb-2">
        <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Active Auctions</h2>
        <p className="text-slate-500 text-[13px] font-medium leading-relaxed">Participate in live bidding for premium mortgage assets</p>
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


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAuctions.length > 0 ? (
          filteredAuctions.map((auction) => (
            <InvestorAuctionCard key={auction.id} auction={auction} />
          ))
        ) : (
          <div className="col-span-full w-full">
            <EmptyState
              message="No auctions found"
              submessage="Try searching for a different location or adjusting your status filters."
            />
          </div>
        )}
      </div>

    </div>
  );
}
