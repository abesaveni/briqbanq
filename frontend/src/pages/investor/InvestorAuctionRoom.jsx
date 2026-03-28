import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import PropTypes from 'prop-types';
import {
  History, ShieldCheck, Mail, Info, FileText,
  TrendingUp, Home, Ruler, UserCheck, Calendar,
  DollarSign, Percent, AlertCircle
} from "lucide-react";

import AuctionHero from "../../components/auctions/AuctionHero";
import AuctionTabs from "../../components/auctions/AuctionTabs";
import BidPanel from "../../components/auctions/BidPanel";
import BidHistory from "../../components/auctions/BidHistory";
import InvestmentSummary from "../../components/auctions/InvestmentSummary";
import InvestmentMemorandum from "../../components/auctions/InvestmentMemorandum";
import DocumentsSection from "../../components/auctions/DocumentsSection";

import { auctionService, casesService, userService } from "../../api/dataService";
import { LoadingState, ErrorState } from "../../components/common/States";
import { formatCurrency } from "../../utils/formatters";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";

function mapBids(rawBids, currentUser) {
  if (!Array.isArray(rawBids)) return [];
  return [...rawBids]
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .map(b => {
      const isMe = currentUser && (
        String(b.bidder_id) === String(currentUser.id) ||
        String(b.bidder_id) === String(currentUser.user_id)
      );
      return {
        ...b,
        user: isMe ? 'You' : (b.bidder_name || 'Investor'),
        time: b.created_at
          ? new Date(b.created_at).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
          : 'Recently',
        amount: Number(b.amount) || 0,
      };
    });
}

/**
 * AuctionRoom: The primary dynamic interface for property investment and live bidding.
 * Abstracted for production with a clean service layer and responsive data fetching.
 */
export default function InvestorAuctionRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State Management
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentBid, setCurrentBid] = useState(0);
  const [bidHistory, setBidHistory] = useState([]);
  const [investorDocs, setInvestorDocs] = useState([]);
  const [isNotified, setIsNotified] = useState(false);

  // Auction ID (resolved after fetching)
  const [auctionId, setAuctionId] = useState(null);

  const { user: currentUser } = useAuth();

  // Data Fetching Logic
  useEffect(() => {
    let isMounted = true;

    const fetchAuctionData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch case (id is always a case_id when navigating from live listings)
        const [caseRes, auctionListRes, bidsRes] = await Promise.all([
          casesService.getCaseById(id),
          auctionService.getAuctionsByCase(id),
          auctionService.getBidsByCase(id),
        ]);

        if (!isMounted) return;

        const caseData = caseRes.success ? caseRes.data : null;
        const auctionList = auctionListRes.success && Array.isArray(auctionListRes.data) ? auctionListRes.data : [];
        const auctionData = auctionList[0] || null;
        const rawBids = bidsRes.success ? (bidsRes.data || []) : [];
        const bids = mapBids(rawBids, currentUser);

        if (!caseData && !auctionData) {
          setError("The requested investment opportunity could not be found.");
          return;
        }

        // Resolve real auction_id for bid placement
        if (auctionData?.id) setAuctionId(auctionData.id);

        // Build unified deal object from case + auction data
        const debt = Number(caseData?.outstanding_debt || 0);
        const value = Number(caseData?.estimated_value || 0);
        const lvr = value > 0 ? ((debt / value) * 100).toFixed(1) : 0;
        const highest = Number(auctionData?.current_highest_bid || 0);

        const API_BASE = "http://localhost:8000";
        const meta = caseData?.metadata_json || {};
        const rawImages = Array.isArray(caseData?.property_images)
          ? caseData.property_images
          : (meta.property_images || []);
        const resolvedImages = rawImages.map(img =>
          img && !img.startsWith("http") ? `${API_BASE}${img}` : img
        ).filter(Boolean);

        const deal = {
          id: auctionData?.id || id,
          title: caseData?.title || auctionData?.title || "Investment Opportunity",
          status: auctionData?.status || "LIVE",
          propertyValue: value,
          type: caseData?.property_type || meta.property_type || "Residential",
          address: caseData?.property_address || "",
          suburb: meta.suburb || caseData?.suburb || "",
          state: meta.state || caseData?.state || "",
          images: resolvedImages,
          image: resolvedImages[0] || null,
          currentBid: highest,
          startingPrice: Number(auctionData?.starting_price || 0),
          minimumIncrement: Number(auctionData?.minimum_increment || 100),
          scheduledEnd: auctionData?.scheduled_end,
          auctionEnd: auctionData?.scheduled_end || auctionData?.actual_end,
          metrics: {
            lvr,
            interestRate: Number(caseData?.interest_rate || 0),
            defaultRate: Number(meta.default_rate) || 0,
            daysInDefault: Number(meta.days_in_default) || 0,
            daysInArrears: 0,
            totalArrears: debt,
          },
          financials: {
            originalLoanAmount: debt,
            outstandingDebt: debt,
            lastPaymentDate: null,
            lastPaymentAmount: 0,
            missedPayments: 0,
            equityAvailable: Math.max(0, value - debt),
          },
          propertyDetails: {
            landSize: meta.land_size ?? "N/A",
            bedrooms: meta.bedrooms ?? caseData?.bedrooms ?? "N/A",
            bathrooms: meta.bathrooms ?? caseData?.bathrooms ?? "N/A",
            parking: meta.parking ?? caseData?.parking ?? "N/A",
            valuer: meta.valuer_name || caseData?.valuer_name || '—',
            valuationDate: null,
          },
          bidHistory: bids,
          documents: [],
        };

        setDeal(deal);
        setCurrentBid(highest);
        setBidHistory(bids);

        // Fetch investor documents
        const docsRes = await userService.getInvestorDocuments();
        if (isMounted && docsRes.success) {
          setInvestorDocs(docsRes.data || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message || "An error occurred while loading the auction data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAuctionData();
    return () => { isMounted = false; };
  }, [id]);

  // Poll bid history every 15s
  useEffect(() => {
    if (!id) return;
    const pollBids = async () => {
      const bidsRes = await auctionService.getBidsByCase(id);
      if (bidsRes.success) {
        const mapped = mapBids(bidsRes.data || [], currentUser);
        setBidHistory(mapped);
        if (mapped.length > 0) setCurrentBid(mapped[0].amount);
      }
    };
    const interval = setInterval(pollBids, 15000);
    return () => clearInterval(interval);
  }, [id, currentUser]);

  // Derived Values
  const metrics = useMemo(() => deal?.metrics || {}, [deal]);
  const financials = useMemo(() => deal?.financials || {}, [deal]);
  const propertyDetails = useMemo(() => deal?.propertyDetails || {}, [deal]);

  const { addNotification } = useNotifications();
  // Status/Error Handlers
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => navigate(0)} />;
  if (!deal) return <div className="p-20 text-center"><p className="text-gray-400">Asset not found.</p></div>;

  // Handlers
  const handlePlaceBid = async (amount) => {
    try {
      // Use resolved auction_id; fall back to URL id (which _get_auction_or_404 can resolve)
      const res = await auctionService.placeBid(auctionId || id, amount);
      if (res.success) {
        setCurrentBid(amount);

        // Optimistic update — show the bid immediately
        const optimisticBid = {
          id: res.data?.id || `optimistic-${Date.now()}`,
          bidder_id: currentUser?.id || currentUser?.user_id,
          bidder_name: currentUser?.full_name || currentUser?.name || 'You',
          amount,
          status: 'WINNING',
          created_at: new Date().toISOString(),
          user: 'You',
          time: new Date().toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        };
        setBidHistory(prev => [optimisticBid, ...prev.map(b => ({ ...b, status: 'OUTBID' }))]);

        // Refresh bid history from backend (replace optimistic with real data)
        const bidsRes = await auctionService.getBidsByCase(id);
        if (bidsRes.success) {
          setBidHistory(mapBids(bidsRes.data || [], currentUser));
        }

        addNotification({
          type: 'bid',
          title: 'Bid Placed Successfully',
          message: `Your bid of ${formatCurrency(amount)} has been submitted.`,
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Bid Failed',
          message: res.error || "Failed to place bid"
        });
      }
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: err.message || "An unexpected error occurred"
      });
    }
  };

  return (
    <div className="pt-0 px-6 pb-6 space-y-4 max-w-[1600px] mx-auto animate-fade-in">

      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Auction Room</h1>
        <p className="text-sm text-gray-500 font-medium">Browse available deals and manage your bids</p>
      </div>


      {/* 1. Hero Section */}
      <AuctionHero deal={deal} />

      <AuctionTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "live" && (
        <div className="space-y-8">
          {/* Key Financial Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              icon={<AlertCircle size={16} />}
              label="Days in Default"
              value={metrics.daysInDefault}
              subLabel={metrics.daysInDefault > 100 ? "Critical status" : "Monitoring status"}
              borderColor="border-red-200"
              bgColor="bg-red-50"
              iconColor="text-red-500"
              valueColor="text-red-600"
              glowColor="shadow-red-500/10"
            />
            <MetricCard
              icon={<Calendar size={16} />}
              label="Days in Arrears"
              value={metrics.daysInArrears}
              subLabel={`${financials.missedPayments || 0} missed payments`}
              borderColor="border-orange-200"
              bgColor="bg-orange-50"
              iconColor="text-orange-500"
              valueColor="text-orange-600"
              glowColor="shadow-orange-500/10"
            />
            <MetricCard
              icon={<TrendingUp size={16} />}
              label="Interest Rate"
              value={`${metrics.interestRate}% `}
              subLabel="Original rate"
              borderColor="border-blue-200"
              bgColor="bg-blue-50"
              iconColor="text-blue-500"
              valueColor="text-blue-600"
              glowColor="shadow-blue-500/10"
            />
            <MetricCard
              icon={<TrendingUp size={16} />}
              label="Default Rate"
              value={`${metrics.defaultRate}% `}
              subLabel="Current penalty rate"
              borderColor="border-purple-200"
              bgColor="bg-purple-50"
              iconColor="text-purple-500"
              valueColor="text-purple-600"
              glowColor="shadow-purple-500/10"
            />
            <MetricCard
              icon={<ShieldCheck size={16} />}
              label="LVR"
              value={`${metrics.lvr}% `}
              subLabel="Loan to value"
              borderColor="border-green-200"
              bgColor="bg-green-50"
              iconColor="text-green-500"
              valueColor="text-green-600"
              glowColor="shadow-green-500/10"
            />
            <MetricCard
              icon={<DollarSign size={16} />}
              label="Total Arrears"
              value={formatCurrency(metrics.totalArrears)}
              subLabel="Outstanding"
              borderColor="border-indigo-200"
              bgColor="bg-indigo-50"
              iconColor="text-indigo-500"
              valueColor="text-indigo-600"
              glowColor="shadow-indigo-500/10"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left Column: Loan & Property Details */}
            <div className="lg:col-span-2 space-y-8">

              {/* 3. Loan Details Section */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6 text-indigo-900">
                  <TrendingUp size={20} />
                  <h3 className="font-bold text-lg">Loan Details</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-y-8 gap-x-12">
                  <DetailItem label="Original Loan Amount" value={formatCurrency(financials.originalLoanAmount)} size="lg" />
                  <DetailItem label="Outstanding Debt" value={formatCurrency(financials.outstandingDebt)} size="lg" />
                  <DetailItem label="Last Payment Date" value={financials.lastPaymentDate || "In Default"} />
                  <DetailItem label="Last Payment Amount" value={formatCurrency(financials.lastPaymentAmount || 0)} />
                  <DetailItem label="Property Valuation" value={formatCurrency(deal.propertyValue)} color="text-green-600" size="lg" />
                  <DetailItem label="Equity Available" value={formatCurrency(financials.equityAvailable || (deal.propertyValue - financials.outstandingDebt))} color="text-green-600" size="lg" />
                </div>

                <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-xl mt-8">
                  <div className="flex items-center gap-2 mb-2 text-orange-700 font-bold text-xs uppercase tracking-widest">
                    <ShieldCheck size={14} /> Risk Assessment
                  </div>
                  <p className="text-xs text-orange-900/80 leading-relaxed font-medium">
                    This loan is {metrics.daysInDefault} days in default with {financials.missedPayments} missed payments. Current LVR of {metrics.lvr}% provides adequate security.
                    Property valuation is current as of {propertyDetails.valuationDate || 'latest report'}.
                  </p>
                </div>
              </div>

              {/* 4. Property Information */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6 text-indigo-900">
                  <Home size={20} />
                  <h3 className="font-bold text-lg">Property Information</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-y-8 gap-x-12">
                  <DetailItem label="Property Type" value={deal.type} />
                  <DetailItem label="Land Size" value={propertyDetails.landSize || "N/A"} />
                  <DetailItem label="Bedrooms" value={propertyDetails.bedrooms || deal.bedrooms} />
                  <DetailItem label="Bathrooms" value={propertyDetails.bathrooms || deal.bathrooms} />
                  <DetailItem label="Parking" value={propertyDetails.parking || deal.parking || 0} />
                  <DetailItem label="Valuer" value={propertyDetails.valuer || "PRP Valuation"} />
                </div>
              </div>

              {/* 5. Documents Section */}
              <DocumentsSection deal={deal} />

              {/* 6. Investor Documents Section (From Registration) */}
              <DocumentsSection
                documents={investorDocs}
                title="My Verification Documents"
                icon={ShieldCheck}
              />
            </div>

            {/* Right Column: Bidding Infrastructure */}
            <div className="space-y-6">
              {deal.status === "Sold" ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Auction Closed</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">This property has been successfully settled.</p>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Final Sale Price</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(deal.currentBid || deal.loanAmount)}</p>
                  </div>
                </div>
              ) : (deal.status === "Coming Soon" || deal.status === "upcoming" || deal.status === "Coming soon") ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                    {isNotified ? <UserCheck size={32} /> : <Calendar size={32} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-indigo-900">{isNotified ? 'Reminder Active' : 'Auction Starting Soon'}</h3>
                    <p className="text-sm text-indigo-500 font-medium mt-1">
                      {isNotified
                        ? "You're all set! We'll alert you when bidding opens."
                        : `Bidding will open on ${deal.auctionEnd ? new Date(deal.auctionEnd).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'soon'}.`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsNotified(true);
                      addNotification({
                        type: 'info',
                        title: 'Reminder Set',
                        message: `We'll notify you as soon as bidding opens for ${deal.title}.`,
                      });
                    }}
                    disabled={isNotified}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${isNotified
                      ? "bg-green-600 text-white shadow-green-100"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                      }`}
                  >
                    {
                      isNotified ? (
                        <>
                          <UserCheck size={18} />
                          Reminder Set
                        </>
                      ) : (
                        <>
                          <Mail size={18} />
                          Notify Me When Live
                        </>
                      )}
                  </button >
                </div >
              ) : (
                <>
                  <BidPanel currentBid={currentBid} startingPrice={deal?.startingPrice || 0} minimumIncrement={deal?.minimumIncrement || 100} placeBid={handlePlaceBid} />
                  <BidHistory history={bidHistory} />
                </>
              )}
              <InvestmentSummary deal={deal} />
            </div >

          </div >
        </div >
      )}

      {
        activeTab === "memorandum" && (
          <InvestmentMemorandum deal={deal} />
        )
      }


    </div >
  );
}

// Sub-components for specialized UI blocks
function MetricCard({
  icon,
  label,
  value,
  subLabel,
  borderColor = "border-gray-100",
  bgColor = "bg-gray-50",
  iconColor = "text-gray-400",
  valueColor = "text-gray-900",
  glowColor = "shadow-gray-200/50"
}) {
  return (
    <div
      className={`bg-white p-4 px-3 rounded-2xl border ${borderColor} shadow-xl ${glowColor} hover:scale-[1.02] transition-all group overflow-hidden`}
      title={`${label}: ${value}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${bgColor} ${iconColor} shrink-0`}>
          {icon}
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none" title={label}>{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueColor} tracking-tight mb-1 whitespace-nowrap`} title={String(value)}>{value || "0"}</p>
      {subLabel && <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap" title={subLabel}>{subLabel}</p>}
    </div>
  );
}

MetricCard.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  subLabel: PropTypes.string,
  borderColor: PropTypes.string,
  bgColor: PropTypes.string,
  iconColor: PropTypes.string,
  valueColor: PropTypes.string
};

function DetailItem({ label, value, size = "base", color = "text-gray-900" }) {
  const isLarge = size === "lg";
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-bold ${isLarge ? 'text-2xl tracking-tight' : 'text-base'} ${color}`}>
        {value || "N/A"}
      </p>
    </div>
  );
}

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  size: PropTypes.oneOf(['base', 'lg']),
  color: PropTypes.string
};

function DetailRow({ label, value, bold = false, color = "text-gray-900" }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-sm tracking-tight ${bold ? 'font-black' : 'font-bold'} ${color}`}>{value || "TBD"}</span>
    </div>
  );
}

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  bold: PropTypes.bool,
  color: PropTypes.string
};
