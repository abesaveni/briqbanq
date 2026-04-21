import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import PropTypes from 'prop-types';
import {
  History, ShieldCheck, Mail, Info, FileText,
  TrendingUp, Home, Ruler, UserCheck, Calendar,
  DollarSign, Percent, AlertCircle, Scale,
  ChevronDown, ChevronUp, Gavel, BarChart2,
  Flag, BookOpen, ClipboardList, Landmark,
  Droplets, Building2, HelpCircle
} from "lucide-react";

import AuctionHero from "../../components/auctions/AuctionHero";
import AuctionTabs from "../../components/auctions/AuctionTabs";
import BidPanel from "../../components/auctions/BidPanel";
import BidHistory from "../../components/auctions/BidHistory";
import InvestmentSummary from "../../components/auctions/InvestmentSummary";
import InvestmentMemorandum from "../../components/auctions/InvestmentMemorandum";
import DocumentsSection from "../../components/auctions/DocumentsSection";

import { auctionService, casesService, userService, documentService } from "../../api/dataService";
import { LoadingState, ErrorState } from "../../components/common/States";
import { formatCurrency } from "../../utils/formatters";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";

function fmtFileSize(bytes) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapCaseDocuments(rawDocs) {
  if (!Array.isArray(rawDocs)) return [];
  return rawDocs.map(doc => ({
    id: doc.id,
    name: doc.document_name || doc.name || "Document",
    type: doc.document_type || doc.type || "PDF",
    size: fmtFileSize(doc.file_size || doc.size),
    file: doc.id ? `/api/v1/documents/${doc.id}/download` : null,
  }));
}

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
  const [loanMetrics, setLoanMetrics] = useState({});
  const [auctionMetrics, setAuctionMetrics] = useState({});

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
        const [caseRes, auctionListRes, bidsRes, docsRes, loanMetricsRes, auctionMetricsRes] = await Promise.all([
          casesService.getCaseById(id),
          auctionService.getAuctionsByCase(id),
          auctionService.getBidsByCase(id),
          documentService.getDocuments(id),
          casesService.getLoanMetrics(id),
          casesService.getAuctionMetrics(id),
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

        const meta = caseData?.metadata_json || {};
        const rawImages = Array.isArray(caseData?.property_images)
          ? caseData.property_images
          : (meta.property_images || []);
        const resolvedImages = rawImages.filter(Boolean);

        const suburb = meta.suburb || caseData?.suburb || "";
        const state = meta.state || caseData?.state || "";
        const postcode = meta.postcode || caseData?.postcode || "";
        const interestRate = Number(caseData?.interest_rate || 0);
        const defaultRate = Number(meta.default_rate) || 0;
        const floorArea = meta.floor_area ? `${meta.floor_area} m²` : (meta.land_size ? `${meta.land_size} m²` : "N/A");

        // Map case documents to DocumentsSection format
        const rawDocsList = docsRes.success && Array.isArray(docsRes.data) ? docsRes.data : (Array.isArray(caseData?.documents) ? caseData.documents : []);
        const caseDocs = mapCaseDocuments(rawDocsList);

        const deal = {
          id: auctionData?.id || id,
          case_id: id,
          title: caseData?.title || auctionData?.title || "Investment Opportunity",
          description: caseData?.description || "",
          status: auctionData?.status || "LIVE",
          propertyValue: value,
          outstandingDebt: debt,
          lvr,
          returnRate: defaultRate || interestRate || 0,
          location: [suburb, state].filter(Boolean).join(", "),
          type: caseData?.property_type || meta.property_type || "Residential",
          address: caseData?.property_address || "",
          suburb,
          state,
          postcode,
          images: resolvedImages,
          image: resolvedImages[0] || null,
          currentBid: highest,
          startingPrice: Number(auctionData?.starting_price || 0),
          minimumIncrement: Number(auctionData?.minimum_increment || 100),
          scheduledEnd: auctionData?.scheduled_end,
          auctionEnd: auctionData?.scheduled_end || auctionData?.actual_end,
          metrics: {
            lvr,
            interestRate,
            defaultRate,
            daysInDefault: Number(meta.days_in_default) || 0,
            daysInArrears: Number(meta.total_arrears ? Math.floor(meta.total_arrears / (debt / 365 || 1)) : 0),
            totalArrears: Number(meta.total_arrears) || debt,
            missedPayments: Number(meta.missed_payments) || 0,
          },
          financials: {
            originalLoanAmount: Number(meta.original_loan_amount) || debt,
            outstandingDebt: debt,
            lastPaymentDate: meta.last_payment_date || null,
            lastPaymentAmount: 0,
            missedPayments: Number(meta.missed_payments) || 0,
            totalArrears: Number(meta.total_arrears) || 0,
            equityAvailable: Math.max(0, value - debt),
            defaultRate: meta.default_rate ? `${meta.default_rate}% p.a.` : null,
            interestRate: interestRate ? `${interestRate}% p.a.` : null,
          },
          propertyDetails: {
            floorArea,
            landSize: floorArea,
            bedrooms: meta.bedrooms ?? caseData?.bedrooms ?? "N/A",
            bathrooms: meta.bathrooms ?? caseData?.bathrooms ?? "N/A",
            kitchens: meta.kitchens ?? "N/A",
            parking: meta.parking ?? caseData?.parking ?? "N/A",
            yearBuilt: meta.year_built || "N/A",
            numberOfStoreys: meta.number_of_storeys || "N/A",
            constructionType: meta.construction_type || "N/A",
            roofType: meta.roof_type || "N/A",
            propertyCondition: meta.property_condition || "N/A",
            recentRenovations: meta.recent_renovations || "N/A",
            specialFeatures: meta.special_features || null,
            councilRates: meta.council_rates ? formatCurrency(meta.council_rates) : "N/A",
            waterRates: meta.water_rates ? formatCurrency(meta.water_rates) : "N/A",
            strataFees: meta.strata_fees ? formatCurrency(meta.strata_fees) : "N/A",
            lastSalePrice: meta.last_sale_price ? formatCurrency(meta.last_sale_price) : "N/A",
            lastSaleDate: meta.last_sale_date || "N/A",
            valuer: meta.valuer_name || meta.valuation_provider || caseData?.valuer_name || "N/A",
            valuationDate: meta.valuation_date || null,
            cbdDistance: meta.cbd_distance || null,
            typeOfSecurity: meta.type_of_security || null,
          },
          bidHistory: bids,
          documents: caseDocs,
          borrower_id: caseData?.borrower_id || null,
        };

        setDeal(deal);
        setCurrentBid(highest);
        setBidHistory(bids);
        if (loanMetricsRes?.success) setLoanMetrics(loanMetricsRes.data || {});
        if (auctionMetricsRes?.success) setAuctionMetrics(auctionMetricsRes.data || {});

        // Fetch investor's own verification documents
        const investorDocsRes = await userService.getInvestorDocuments();
        if (isMounted && investorDocsRes.success) {
          setInvestorDocs(investorDocsRes.data || []);
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

      {activeTab === "overview" && (
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

              {/* Debt Breakdown Panel */}
              {(loanMetrics.principal_amount || loanMetrics.total_payout) && (
                <CollapsibleSection icon={<DollarSign size={18} />} title="Debt Breakdown">
                  <div className="space-y-2">
                    {[
                      ['Principal Outstanding', loanMetrics.principal_amount],
                      ['Accrued Interest', loanMetrics.accrued_interest],
                      ['Default / Penalty Interest', loanMetrics.default_interest],
                      ['Other Fees & Charges', loanMetrics.other_fees],
                      ['Legal Costs', loanMetrics.legal_costs],
                    ].map(([label, val]) => val != null && (
                      <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-500">{label}</span>
                        <span className="text-sm font-semibold text-gray-800">{formatCurrency(val)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 mt-1">
                      <span className="text-sm font-bold text-gray-900">Total Payout Required</span>
                      <span className="text-base font-bold text-red-600">{formatCurrency(loanMetrics.total_payout)}</span>
                    </div>
                  </div>
                  {loanMetrics.days_in_arrears > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-400">Days in Arrears</p>
                        <p className="text-lg font-bold text-orange-600">{loanMetrics.days_in_arrears}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Missed Payments</p>
                        <p className="text-lg font-bold text-orange-600">{loanMetrics.missed_payments || 0}</p>
                      </div>
                      {loanMetrics.arrears_start_date && (
                        <div>
                          <p className="text-xs text-gray-400">Arrears Since</p>
                          <p className="text-sm font-semibold">{new Date(loanMetrics.arrears_start_date).toLocaleDateString('en-AU')}</p>
                        </div>
                      )}
                      {loanMetrics.last_payment_date && (
                        <div>
                          <p className="text-xs text-gray-400">Last Payment</p>
                          <p className="text-sm font-semibold">{new Date(loanMetrics.last_payment_date).toLocaleDateString('en-AU')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CollapsibleSection>
              )}

              {/* Recovery Analysis */}
              {(loanMetrics.forced_sale_estimate || loanMetrics.net_recovery) && (
                <CollapsibleSection icon={<BarChart2 size={18} />} title="Conservative Recovery Model">
                  <div className="space-y-2">
                    {[
                      ['Market Value', loanMetrics.market_value || deal.propertyValue],
                      ['Forced Sale Estimate', loanMetrics.forced_sale_estimate],
                      ['Less: Selling Costs', loanMetrics.selling_costs ? -loanMetrics.selling_costs : null],
                      ['Less: Legal Costs', loanMetrics.legal_costs ? -loanMetrics.legal_costs : null],
                      ['Less: Holding Costs', loanMetrics.holding_costs ? -loanMetrics.holding_costs : null],
                    ].map(([label, val]) => val != null && (
                      <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-500">{label}</span>
                        <span className={`text-sm font-semibold ${val < 0 ? 'text-red-500' : 'text-gray-800'}`}>{formatCurrency(Math.abs(val))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 mt-1">
                      <span className="text-sm font-bold text-gray-900">Estimated Net Recovery</span>
                      <span className="text-base font-bold text-green-600">{formatCurrency(loanMetrics.net_recovery)}</span>
                    </div>
                    {loanMetrics.equity_buffer != null && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-900">Equity Buffer After Costs</span>
                        <span className={`text-base font-bold ${loanMetrics.equity_buffer >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(loanMetrics.equity_buffer)}</span>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Scenario Analysis */}
              {(auctionMetrics.scenario_base || auctionMetrics.scenario_conservative || auctionMetrics.scenario_downside) && (
                <CollapsibleSection icon={<BookOpen size={18} />} title="Scenario Analysis">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Base Case', data: auctionMetrics.scenario_base, color: 'bg-green-50 border-green-200 text-green-700' },
                      { label: 'Conservative', data: auctionMetrics.scenario_conservative, color: 'bg-amber-50 border-amber-200 text-amber-700' },
                      { label: 'Downside', data: auctionMetrics.scenario_downside, color: 'bg-red-50 border-red-200 text-red-700' },
                    ].map(({ label, data, color }) => data && (
                      <div key={label} className={`rounded-xl border p-3 ${color}`}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
                        {data.recovery_amount != null && <p className="text-sm font-bold">{formatCurrency(data.recovery_amount)}</p>}
                        {data.net_profit != null && <p className="text-xs mt-1">Net: {formatCurrency(data.net_profit)}</p>}
                        {data.roi != null && <p className="text-xs">ROI: {data.roi}%</p>}
                        {data.timeline && <p className="text-xs mt-1">{data.timeline}</p>}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Recovery Strategy & Legal Position */}
              {(auctionMetrics.enforcement_type || auctionMetrics.default_valid != null) && (
                <CollapsibleSection icon={<Landmark size={18} />} title="Legal Position & Recovery Strategy">
                  <div className="grid md:grid-cols-2 gap-6">
                    {auctionMetrics.enforcement_type && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Enforcement Type</p>
                        <p className="text-sm font-semibold">{auctionMetrics.enforcement_type}</p>
                      </div>
                    )}
                    {[
                      ['Default Valid', auctionMetrics.default_valid],
                      ['Acceleration Triggered', auctionMetrics.acceleration_triggered],
                      ['Enforcement Commenced', auctionMetrics.enforcement_commenced],
                      ['Court Action', auctionMetrics.court_action],
                      ['Borrower Dispute', auctionMetrics.borrower_dispute],
                      ['Injunction', auctionMetrics.injunction],
                    ].map(([label, val]) => val != null && (
                      <div key={label} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${val ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-600">{label}</span>
                        <span className={`ml-auto text-xs font-bold ${val ? 'text-green-600' : 'text-gray-400'}`}>{val ? 'Yes' : 'No'}</span>
                      </div>
                    ))}
                    {auctionMetrics.notice_date && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Notice Date</p>
                        <p className="text-sm font-semibold">{new Date(auctionMetrics.notice_date).toLocaleDateString('en-AU')}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Risk Flags */}
              {auctionMetrics.risk_flags && Object.keys(auctionMetrics.risk_flags).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3 text-red-700">
                    <Flag size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Risk Flags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(auctionMetrics.risk_flags).map(([key, val]) => val && (
                      <span key={key} className="text-xs bg-red-100 text-red-700 border border-red-200 rounded-full px-3 py-1 font-medium">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Property Liquidity Section (§8.6) */}
              {(loanMetrics.forced_sale_estimate || auctionMetrics.liquidity_rating || propertyDetails.valuer) && (
                <CollapsibleSection icon={<Droplets size={18} />} title="Property Liquidity">
                  <div className="grid grid-cols-2 gap-4">
                    {propertyDetails.valuer && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Valuation Provider</p>
                        <p className="text-sm font-semibold">{propertyDetails.valuer}</p>
                      </div>
                    )}
                    {propertyDetails.valuationDate && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Valuation Date</p>
                        <p className="text-sm font-semibold">{new Date(propertyDetails.valuationDate).toLocaleDateString('en-AU')}</p>
                      </div>
                    )}
                    {loanMetrics.forced_sale_estimate && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Forced Sale Estimate</p>
                        <p className="text-sm font-bold text-amber-600">{formatCurrency(loanMetrics.forced_sale_estimate)}</p>
                      </div>
                    )}
                    {deal.propertyValue && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Market Value</p>
                        <p className="text-sm font-bold text-gray-800">{formatCurrency(deal.propertyValue)}</p>
                      </div>
                    )}
                    {auctionMetrics.days_on_market != null && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Days on Market</p>
                        <p className="text-sm font-semibold">{auctionMetrics.days_on_market}</p>
                      </div>
                    )}
                    {auctionMetrics.liquidity_rating && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Liquidity Rating</p>
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                          auctionMetrics.liquidity_rating === 'High' ? 'bg-green-100 text-green-700' :
                          auctionMetrics.liquidity_rating === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{auctionMetrics.liquidity_rating}</span>
                      </div>
                    )}
                    {propertyDetails.propertyCondition && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Property Condition</p>
                        <p className="text-sm font-semibold">{propertyDetails.propertyCondition}</p>
                      </div>
                    )}
                  </div>
                  {auctionMetrics.comparable_sales_summary && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Comparable Sales Summary</p>
                      <p className="text-sm text-gray-700">{auctionMetrics.comparable_sales_summary}</p>
                    </div>
                  )}
                </CollapsibleSection>
              )}

              {/* Investment Structure Summary (§8.10) */}
              {(auctionMetrics.investment_structure || auctionMetrics.minimum_bid || auctionMetrics.ownership_rights) && (
                <CollapsibleSection icon={<Building2 size={18} />} title="Investment Structure">
                  <div className="space-y-3">
                    {auctionMetrics.investment_structure && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 flex items-center gap-3">
                        <HelpCircle size={16} className="text-indigo-500 shrink-0" />
                        <div>
                          <p className="text-xs text-indigo-600 font-semibold">What are you buying?</p>
                          <p className="text-sm font-bold text-indigo-900 mt-0.5">{auctionMetrics.investment_structure}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {auctionMetrics.minimum_bid && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Minimum Bid</p>
                          <p className="text-sm font-bold text-gray-800">{formatCurrency(auctionMetrics.minimum_bid)}</p>
                        </div>
                      )}
                    </div>
                    {auctionMetrics.ownership_rights && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Ownership Rights</p>
                        <p className="text-sm text-gray-700">{auctionMetrics.ownership_rights}</p>
                      </div>
                    )}
                    {auctionMetrics.security_rights && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Security Rights</p>
                        <p className="text-sm text-gray-700">{auctionMetrics.security_rights}</p>
                      </div>
                    )}
                    {auctionMetrics.distribution_mechanics && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Distribution Mechanics</p>
                        <p className="text-sm text-gray-700">{auctionMetrics.distribution_mechanics}</p>
                      </div>
                    )}
                    {/* Reserve logic explanation (§8.9) */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-1.5 mt-2">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">How the Reserve Works</p>
                      <p className="text-xs text-gray-500">The reserve is the minimum acceptable sale price set by the lender. Bids below reserve are recorded but the case will not close until a bid meets or exceeds the reserve. The reserve gap shown in the bid panel is how far the current highest bid is from the reserve amount.</p>
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {/* 4. Property Information */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6 text-indigo-900">
                  <Home size={20} />
                  <h3 className="font-bold text-lg">Property Information</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
                  <DetailItem label="Property Type" value={deal.type} />
                  <DetailItem label="Floor Area" value={propertyDetails.floorArea} />
                  <DetailItem label="Bedrooms" value={propertyDetails.bedrooms} />
                  <DetailItem label="Bathrooms" value={propertyDetails.bathrooms} />
                  <DetailItem label="Kitchens" value={propertyDetails.kitchens} />
                  <DetailItem label="Parking" value={propertyDetails.parking} />
                  <DetailItem label="Year Built" value={propertyDetails.yearBuilt} />
                  <DetailItem label="Construction" value={propertyDetails.constructionType} />
                  <DetailItem label="Condition" value={propertyDetails.propertyCondition} />
                  <DetailItem label="Valuer" value={propertyDetails.valuer} />
                  <DetailItem label="Suburb" value={`${deal.suburb}${deal.postcode ? ` ${deal.postcode}` : ''}`} />
                  <DetailItem label="State" value={deal.state} />
                </div>
              </div>

              {/* 5. Documents Section */}
              <DocumentsSection deal={deal} />

              {/* 6. Investor Documents Section (From Registration) */}
              {investorDocs.length > 0 && (
                <DocumentsSection
                  documents={investorDocs}
                  title="My Verification Documents"
                  icon={ShieldCheck}
                />
              )}
            </div>

            {/* Right Column: Bidding Infrastructure */}
            <div className="space-y-6">
              {(deal.status === "ENDED" || deal.status === "Sold") ? (
                <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Auction Closed</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">This property has been successfully settled.</p>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Final Sale Price</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(deal.currentBid || deal.loanAmount)}</p>
                  </div>
                </div>
              ) : (deal.status === "SCHEDULED" || deal.status === "Coming Soon" || deal.status === "upcoming") ? (
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
              ) : (() => {
                // Lawyers cannot bid on cases they created (their user_id is stored as borrower_id)
                const currentUserId = String(currentUser?.id || currentUser?.user_id || '')
                const userRoles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : [])
                const isLawyer = userRoles.some(r => String(r).toLowerCase() === 'lawyer')
                const isOwnCase = isLawyer && deal?.borrower_id && String(deal.borrower_id) === currentUserId
                return isOwnCase ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-medium text-amber-800">You cannot bid on a case you created.</p>
                  </div>
                ) : (
                  <>
                    <BidPanel currentBid={currentBid} startingPrice={deal?.startingPrice || 0} minimumIncrement={deal?.minimumIncrement || 100} placeBid={handlePlaceBid} />
                    <BidHistory history={bidHistory} />
                  </>
                )
              })()}
              <InvestmentSummary deal={deal} />
            </div >

          </div >
        </div >
      )}

      {activeTab === "memorandum" && (
        <InvestmentMemorandum deal={deal} />
      )}

      {activeTab === "property" && (
        <div className="space-y-6">
          {/* Location */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Location</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <DetailItem label="Full Address" value={deal.address} />
              <DetailItem label="Suburb" value={deal.suburb} />
              <DetailItem label="State" value={deal.state} />
              <DetailItem label="Postcode" value={deal.postcode} />
              {propertyDetails.cbdDistance && <DetailItem label="CBD Distance" value={propertyDetails.cbdDistance} />}
            </div>
          </div>

          {/* Property Features */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Property Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <DetailItem label="Property Type" value={deal.type} />
              <DetailItem label="Floor Area" value={propertyDetails.floorArea} />
              <DetailItem label="Bedrooms" value={propertyDetails.bedrooms} />
              <DetailItem label="Bathrooms" value={propertyDetails.bathrooms} />
              <DetailItem label="Kitchens" value={propertyDetails.kitchens} />
              <DetailItem label="Parking Spaces" value={propertyDetails.parking} />
              <DetailItem label="Year Built" value={propertyDetails.yearBuilt} />
              <DetailItem label="Storeys" value={propertyDetails.numberOfStoreys} />
              <DetailItem label="Construction" value={propertyDetails.constructionType} />
              <DetailItem label="Roof Type" value={propertyDetails.roofType} />
              <DetailItem label="Condition" value={propertyDetails.propertyCondition} />
              {propertyDetails.typeOfSecurity && <DetailItem label="Security Type" value={propertyDetails.typeOfSecurity} />}
            </div>
            {propertyDetails.specialFeatures && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Special Features</p>
                <p className="text-sm text-gray-700">{propertyDetails.specialFeatures}</p>
              </div>
            )}
          </div>

          {/* Outgoings */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Outgoings &amp; Rates</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <DetailItem label="Council Rates" value={propertyDetails.councilRates} />
              <DetailItem label="Water Rates" value={propertyDetails.waterRates} />
              <DetailItem label="Strata Fees" value={propertyDetails.strataFees} />
            </div>
          </div>

          {/* Sales History */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Sales History &amp; Valuation</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <DetailItem label="Last Sale Price" value={propertyDetails.lastSalePrice} />
              <DetailItem label="Last Sale Date" value={propertyDetails.lastSaleDate} />
              <DetailItem label="Current Valuation" value={formatCurrency(deal.propertyValue)} color="text-green-600" size="lg" />
              <DetailItem label="Valuation Date" value={propertyDetails.valuationDate || "N/A"} />
              <DetailItem label="Valuer" value={propertyDetails.valuer} />
            </div>
          </div>

          {deal.description && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Property Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{deal.description}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="space-y-4">
          <DocumentsSection deal={deal} />
          {investorDocs.length > 0 && (
            <DocumentsSection documents={investorDocs} title="My Verification Documents" icon={ShieldCheck} />
          )}
        </div>
      )}

      {activeTab === "bid-history" && (
        <div className="space-y-4">
          {/* Bid summary bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Total Bids</p>
              <p className="text-2xl font-bold text-gray-900">{bidHistory.length}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Highest Bid</p>
              <p className="text-2xl font-bold text-emerald-600">{bidHistory.length > 0 ? formatCurrency(bidHistory[0].amount) : '—'}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Reserve Gap</p>
              <p className="text-2xl font-bold text-indigo-600">
                {deal?.startingPrice && bidHistory.length > 0
                  ? formatCurrency(Math.max(0, deal.startingPrice - bidHistory[0].amount))
                  : '—'}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Bid History ({bidHistory.length})</h3>
              <span className="text-xs text-gray-400">Live updates every 15s</span>
            </div>
            {bidHistory.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No bids placed yet.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {bidHistory.map((b, i) => {
                  const increment = i < bidHistory.length - 1 ? b.amount - bidHistory[i + 1].amount : null;
                  return (
                    <div key={b.id || i} className={`flex items-center justify-between px-5 py-3.5 ${i === 0 ? 'bg-emerald-50/50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{b.user}</p>
                          <p className="text-xs text-gray-400">{b.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${i === 0 ? 'text-emerald-600' : 'text-gray-700'}`}>{formatCurrency(b.amount)}</p>
                        {i === 0 && <p className="text-xs text-emerald-500 font-medium">Leading bid</p>}
                        {increment != null && increment > 0 && (
                          <p className="text-xs text-indigo-500">+{formatCurrency(increment)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "lawyer-review" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Scale size={20} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Lawyer Review</h3>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Review Summary — Confidential</p>
              <p className="text-sm text-gray-500">The full legal compliance review is conducted by the assigned lawyer and is confidential. You will be notified when the review is complete and the outcome is available.</p>
            </div>
          </div>
        </div>
      )}

    </div>
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
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none" title={label}>{label}</p>
      </div>
      <p className={`text-2xl font-bold ${valueColor} tracking-tight mb-1 whitespace-nowrap`} title={String(value)}>{value || "0"}</p>
      {subLabel && <p className="text-xs text-gray-400 font-medium whitespace-nowrap" title={subLabel}>{subLabel}</p>}
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
      <span className={`text-sm tracking-tight ${bold ? 'font-bold' : 'font-bold'} ${color}`}>{value || "TBD"}</span>
    </div>
  );
}

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  bold: PropTypes.bool,
  color: PropTypes.string
};

function CollapsibleSection({ icon, title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-indigo-900 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-base">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

CollapsibleSection.propTypes = {
  icon: PropTypes.element.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
