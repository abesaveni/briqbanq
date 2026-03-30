import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import PropTypes from 'prop-types';
import {
    History, ShieldCheck, Mail, Info, FileText,
    TrendingUp, Home, Ruler, UserCheck, Calendar,
    DollarSign, Percent, AlertCircle, Activity
} from "lucide-react";

import AuctionHero from "../../components/auctions/AuctionHero";
import AuctionTabs from "../../components/auctions/AuctionTabs";
import BidPanel from "../../components/auctions/BidPanel";
import BidHistory from "../../components/auctions/BidHistory";
import InvestmentSummary from "../../components/auctions/InvestmentSummary";
import InvestmentMemorandum from "../../components/auctions/InvestmentMemorandum";
import DocumentsSection from "../../components/auctions/DocumentsSection";

import { auctionService, casesService, activityService } from "../../api/dataService";
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
                user: isMe ? 'You' : (b.bidder_name || 'Lender'),
                time: b.created_at
                    ? new Date(b.created_at).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Recently',
                amount: Number(b.amount) || 0,
            };
        });
}

export default function LenderAuctionRoom() {
    const { id } = useParams();
    const navigate = useNavigate();

    // State Management
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("live");
    const [currentBid, setCurrentBid] = useState(0);
    const [bidHistory, setBidHistory] = useState([]);
    const [isNotified, setIsNotified] = useState(false);

    // Auction ID (resolved after fetching)
    const [auctionId, setAuctionId] = useState(null);
    const [startingPrice, setStartingPrice] = useState(0);
    const [minimumIncrement, setMinimumIncrement] = useState(100);

    const { user: currentUser } = useAuth();

    // Data Fetching Logic
    useEffect(() => {
        let isMounted = true;

        const fetchAuctionData = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch: case details + auctions for this case + bids
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
                    setError("The requested recovery opportunity could not be found.");
                    return;
                }

                // Resolve real auction_id for bid placement
                if (auctionData?.id) setAuctionId(auctionData.id);
                if (auctionData?.starting_price) setStartingPrice(Number(auctionData.starting_price));
                if (auctionData?.minimum_increment) setMinimumIncrement(Number(auctionData.minimum_increment));

                const meta = caseData?.metadata_json || {};
                const estimated = parseFloat(caseData?.estimated_value || 0);
                const outstanding = parseFloat(caseData?.outstanding_debt || caseData?.asking_price || 0);
                const lvr = estimated > 0 ? Math.round((outstanding / estimated) * 100) : 0;
                const equity = Math.max(0, estimated - outstanding);
                const highest = Number(auctionData?.current_highest_bid || 0);

                const images = Array.isArray(caseData?.property_images) ? caseData.property_images : [];
                const image = images.length > 0 ? images[0] : null;

                // Build unified deal object from both case + auction data
                const deal = {
                    id: auctionData?.id || id,
                    case_id: id,
                    title: caseData?.title || caseData?.property_address || auctionData?.title || "Recovery Asset",
                    status: auctionData?.status || "SCHEDULED",
                    image,
                    auctionEnd: auctionData?.scheduled_end || auctionData?.actual_end || null,
                    currentBid: highest,
                    bidHistory: bids,
                    propertyValue: estimated,
                    type: caseData?.property_type || meta?.property_type || "Property",
                    bedrooms: meta?.bedrooms || 0,
                    bathrooms: meta?.bathrooms || 0,
                    parking: meta?.parking || 0,
                    metrics: {
                        lvr,
                        interestRate: parseFloat(caseData?.interest_rate || 0),
                        daysInDefault: Number(meta?.days_in_default) || 0,
                        daysInArrears: 0,
                        totalArrears: outstanding,
                        defaultRate: Number(meta?.default_rate) || 0,
                    },
                    financials: {
                        outstandingDebt: outstanding,
                        originalLoanAmount: outstanding,
                        equityAvailable: equity,
                        lastPaymentDate: null,
                        lastPaymentAmount: 0,
                        missedPayments: 0,
                    },
                    propertyDetails: {
                        bedrooms: meta?.bedrooms || 0,
                        bathrooms: meta?.bathrooms || 0,
                        parking: meta?.parking || 0,
                        landSize: meta?.land_size || "N/A",
                    },
                    documents: Array.isArray(caseData?.documents) ? caseData.documents : [],
                    suburb: meta?.suburb || "",
                    state: meta?.state || "",
                    postcode: meta?.postcode || "",
                    lvr,
                    outstandingDebt: outstanding,
                };

                setDeal(deal);
                setCurrentBid(highest);
                setBidHistory(bids);

            } catch (err) {
                if (isMounted) setError(err.message || "An error occurred while loading the auction data.");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAuctionData();
        return () => { isMounted = false; };
    }, [id]);

    // Poll bid history every 15s so all viewers see new bids in near-real-time
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

    const metrics = useMemo(() => deal?.metrics || {}, [deal]);
    const financials = useMemo(() => deal?.financials || {}, [deal]);
    const propertyDetails = useMemo(() => deal?.propertyDetails || {}, [deal]);

    const { addNotification } = useNotifications();

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={() => navigate(0)} />;
    if (!deal) return <div className="p-20 text-center"><p className="text-gray-400 font-bold italic uppercase tracking-widest">Asset Not Found</p></div>;

    const handlePlaceBid = async (amount) => {
        try {
            // Use resolved auctionId or fallback to URL id
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

                // Success Notification
                addNotification({
                    type: 'bid',
                    title: 'Lender Bid Placed',
                    message: `Your bid of ${formatCurrency(amount)} has been successfully registered.`,
                });

                // Platform-wide Activity Log
                if (activityService?.logActivity) {
                    activityService.logActivity({
                        title: `Bid placed on ${deal.title}`,
                        details: `You placed a recovery bid of ${formatCurrency(amount)}`,
                        type: "bid"
                    });
                }

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
        <div className="pt-0 px-6 pb-12 space-y-6 max-w-[1600px] mx-auto animate-fade-in">

            {/* Page Header */}
            <div className="pb-2">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Auction Room</h1>
                <p className="text-sm text-gray-500 font-medium">Manage defaulted assets and bid on recovery opportunities</p>
            </div>


            {/* 1. Hero Section */}
            <AuctionHero deal={deal} />

            <div className="bg-gray-50/50 p-1 rounded-2xl border border-gray-100 flex w-full">
                <AuctionTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            {activeTab === "live" && (
                <div className="space-y-8">
                    {/* Key Financial Metrics Row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <MetricCard
                            icon={<AlertCircle size={16} />}
                            label="Days in Default"
                            value={metrics.daysInDefault || 0}
                            subLabel={(metrics.daysInDefault || 0) > 100 ? "Critical status" : "Monitoring status"}
                            borderColor="border-red-200"
                            bgColor="bg-red-50"
                            iconColor="text-red-500"
                            valueColor="text-red-600"
                            glowColor="shadow-red-500/10"
                        />
                        <MetricCard
                            icon={<Calendar size={16} />}
                            label="Days in Arrears"
                            value={metrics.daysInArrears || 0}
                            subLabel={`${financials.missedPayments || 0} missed payments`}
                            borderColor="border-orange-200"
                            bgColor="bg-orange-50"
                            iconColor="text-orange-500"
                            valueColor="text-orange-600"
                            glowColor="shadow-orange-500/10"
                        />
                        <MetricCard
                            icon={<Percent size={16} />}
                            label="Interest Rate"
                            value={`${metrics.interestRate || 0}%`}
                            subLabel="Original loan rate"
                            borderColor="border-blue-200"
                            bgColor="bg-blue-50"
                            iconColor="text-blue-500"
                            valueColor="text-blue-600"
                            glowColor="shadow-blue-500/10"
                        />
                        <MetricCard
                            icon={<TrendingUp size={16} />}
                            label="Default Rate"
                            value={`${metrics.defaultRate || 0}%`}
                            subLabel="Penalty interest"
                            borderColor="border-purple-200"
                            bgColor="bg-purple-50"
                            iconColor="text-purple-500"
                            valueColor="text-purple-600"
                            glowColor="shadow-purple-500/10"
                        />
                        <MetricCard
                            icon={<ShieldCheck size={16} />}
                            label="Current LVR"
                            value={`${metrics.lvr || 0}%`}
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
                            value={formatCurrency(metrics.totalArrears || 0)}
                            subLabel="Total outstanding"
                            borderColor="border-indigo-200"
                            bgColor="bg-indigo-50"
                            iconColor="text-indigo-500"
                            valueColor="text-indigo-600"
                            glowColor="shadow-indigo-500/10"
                        />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-10">

                        {/* Left Column: Loan & Property Details */}
                        <div className="lg:col-span-2 space-y-10">

                            {/* 3. Loan Details Section */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2 mb-6 text-indigo-900">
                                    <Activity size={20} className="text-indigo-600" />
                                    <h3 className="font-bold text-lg">Debt Exposure Analysis</h3>
                                </div>

                                <div className="grid md:grid-cols-2 gap-y-8 gap-x-12">
                                    <DetailItem label="Original Loan Principal" value={formatCurrency(financials.originalLoanAmount)} size="lg" />
                                    <DetailItem label="Total Outstanding Debt" value={formatCurrency(financials.outstandingDebt)} size="lg" color="text-red-600" />
                                    <DetailItem label="Last Payment Received" value={financials.lastPaymentDate || "IN DEFAULT"} />
                                    <DetailItem label="Last Settlement Amount" value={formatCurrency(financials.lastPaymentAmount || 0)} />
                                    <DetailItem label="Market Property Valuation" value={formatCurrency(deal.propertyValue)} color="text-green-600" size="lg" />
                                    <DetailItem label="Equity Cushion" value={formatCurrency(financials.equityAvailable || (deal.propertyValue - financials.outstandingDebt))} color="text-green-600" size="lg" />
                                </div>

                                <div className="bg-slate-900 text-white p-6 rounded-2xl mt-8 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                                            <ShieldCheck size={14} /> Risk Assessment
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                                            "Analysis indicates this asset is {metrics.daysInDefault || 0} days past due. With {financials.missedPayments || 0} consecutive missed payments, the recovery process has been initiated. The LVR of {metrics.lvr || 0}% remains well within the risk threshold of 80%, ensuring substantial collateral coverage."
                                        </p>
                                    </div>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full translate-x-16 -translate-y-16 blur-2xl"></div>
                                </div>
                            </div>

                            {/* 4. Property Information */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2 mb-6 text-indigo-900">
                                    <Home size={20} className="text-indigo-600" />
                                    <h3 className="font-bold text-lg">Property Information</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <DetailItem label="Property Asset Class" value={deal.type} />
                                    <DetailItem label="Land Size" value={propertyDetails.landSize || "N/A"} />
                                    <DetailItem label="Bedrooms" value={propertyDetails.bedrooms || deal.bedrooms || "—"} />
                                    <DetailItem label="Bathrooms" value={propertyDetails.bathrooms || deal.bathrooms || "—"} />
                                    <DetailItem label="Parking Capacity" value={propertyDetails.parking || deal.parking || "—"} />
                                    <DetailItem label="Accredited Valuer" value={propertyDetails.valuer || "PRP Valuation"} />
                                </div>
                            </div>

                            {/* 5. Documents Section */}
                            <DocumentsSection deal={deal} />
                        </div>

                        {/* Right Column: Bidding Infrastructure */}
                        <div className="space-y-8">
                            {deal.status === "Sold" ? (
                                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 text-center space-y-6 shadow-2xl">
                                    <div className="w-20 h-20 bg-white text-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
                                        <ShieldCheck size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white italic uppercase tracking-tight">Settlement Finalized</h3>
                                        <p className="text-sm text-slate-400 font-bold mt-2 italic">Recovery process successfully completed.</p>
                                    </div>
                                    <div className="pt-6 border-t border-slate-800">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Final Recovery Amount</p>
                                        <p className="text-4xl font-bold text-white tracking-tight">{formatCurrency(deal.currentBid || deal.loanAmount)}</p>
                                    </div>
                                </div>
                            ) : (deal.status === "Coming Soon" || deal.status === "upcoming" || deal.status === "Coming soon") ? (
                                <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-center space-y-6 shadow-2xl shadow-indigo-200">
                                    <div className="w-20 h-20 bg-white text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                                        {isNotified ? <UserCheck size={40} /> : <Calendar size={40} />}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white italic uppercase tracking-tight">{isNotified ? 'Auction Monitored' : 'Opening Soon'}</h3>
                                        <p className="text-sm text-indigo-100 font-bold mt-2">
                                            {isNotified
                                                ? "Notification active. Monitoring for live status."
                                                : `Bidding opens ${deal.auctionEnd ? new Date(deal.auctionEnd).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'soon'}.`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsNotified(true);
                                            addNotification({
                                                type: 'info',
                                                title: 'Lender Monitor Set',
                                                message: `Asset tracking enabled for ${deal.title}. We'll alert you at live status.`,
                                            });
                                        }}
                                        disabled={isNotified}
                                        className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl ${isNotified
                                            ? "bg-white/20 text-white cursor-default"
                                            : "bg-white text-indigo-700 hover:bg-indigo-50"
                                            }`}
                                    >
                                        {isNotified ? "Tracking Active" : "Track This Asset"}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100">
                                        <BidPanel currentBid={currentBid} startingPrice={startingPrice} minimumIncrement={minimumIncrement} placeBid={handlePlaceBid} />
                                    </div>
                                    <div className="rounded-[2.5rem] overflow-hidden border border-gray-100">
                                        <BidHistory history={bidHistory} />
                                    </div>
                                </>
                            )}
                            <div className="rounded-[2.5rem] overflow-hidden border border-gray-100">
                                <InvestmentSummary deal={deal} />
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {activeTab === "memorandum" && (
                <div className="rounded-[2.5rem] overflow-hidden border border-gray-100 bg-white shadow-xl p-10">
                    <InvestmentMemorandum deal={deal} />
                </div>
            )}


        </div>
    );
}

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
            className={`bg-white p-5 rounded-3xl border ${borderColor} shadow-xl ${glowColor} hover:scale-[1.02] transition-all group overflow-hidden`}
        >
            <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-xl ${bgColor} ${iconColor} shrink-0`}>
                    {icon}
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] leading-none">{label}</p>
            </div>
            <p className={`text-3xl font-bold ${valueColor} tracking-tight mb-1`}>{value || "0"}</p>
            {subLabel && <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide opacity-60">{subLabel}</p>}
        </div>
    );
}

function DetailItem({ label, value, size = "base", color = "text-gray-900", mono = false, valueColor }) {
    const isLarge = size === "lg";
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className={`font-bold ${isLarge ? 'text-2xl tracking-tight' : 'text-base font-semibold'} ${valueColor || color} ${mono ? 'font-mono' : ''}`}>
                {value || "N/A"}
            </p>
        </div>
    );
}
