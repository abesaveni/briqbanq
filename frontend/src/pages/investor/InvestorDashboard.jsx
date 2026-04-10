import React, { useState, useEffect, useMemo } from "react";
import InvestorPortfolioHero from "../../components/investor_dashboard/InvestorPortfolioHero";
import InvestorPerformanceCards from "../../components/investor_dashboard/InvestorPerformanceCards";
import InvestorAlerts from "../../components/investor_dashboard/InvestorAlerts";
import InvestorActiveInvestments from "../../components/investor_dashboard/InvestorActiveInvestments";
import InvestorSidebarWidgets from "../../components/investor_dashboard/InvestorSidebarWidgets";
import { useAuth } from "../../context/AuthContext";
import { investorService } from "../../api/dataService";
import { LoadingState, ErrorState } from "../../components/common/States";

function resolveImage(url) {
    if (!url) return null;
    return url;
}
function mapCaseToInvestment(c) {
    const meta = c.metadata_json || {};
    const outstandingDebt = parseFloat(c.outstanding_debt) || 0;
    const propertyValue = parseFloat(c.estimated_value) || 0;
    const lvr = propertyValue > 0 ? Math.round((outstandingDebt / propertyValue) * 100) : 0;
    const images = Array.isArray(c.property_images) ? c.property_images : (meta.property_images || []);
    return {
        id: c.id,
        case_id: c.id,
        case_number: c.case_number || null,
        title: c.title || c.property_address || "Investment Property",
        status: c.auction_status === "LIVE" ? "Live Auction"
            : c.auction_status === "SCHEDULED" ? "Coming Soon"
            : c.auction_status === "PAUSED" ? "Paused"
            : c.auction_status === "ENDED" ? "Ended"
            : c.status === "AUCTION" ? "In Auction"
            : "Active",
        image: images[0] ? resolveImage(images[0]) : null,
        suburb: meta.suburb || c.suburb || "",
        state: meta.state || c.state || "",
        postcode: meta.postcode || c.postcode || "",
        currentBid: c.my_bid || 0,
        bidStatus: c.bid_status || null,
        returnRate: parseFloat(c.interest_rate) || 0,
        lvr,
        created_at: c.created_at,
        loanAmount: outstandingDebt,
        propertyValue,
        type: c.property_type || meta.property_type || "House",
        bedrooms: meta.bedrooms ?? c.bedrooms ?? 0,
        bathrooms: meta.bathrooms ?? c.bathrooms ?? 0,
        kitchens: meta.kitchens ?? c.kitchens ?? 0,
        parking: meta.parking ?? c.parking ?? 0,
    };
}

export default function InvestorDashboard() {
    const { user } = useAuth();
    const firstName = user?.firstName || (user?.name || "").split(' ')[0] || "User";
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await investorService.getMyInvestmentCases();
                if (res.success) {
                    const items = Array.isArray(res.data) ? res.data : [];
                    setInvestments(items.map(mapCaseToInvestment));
                } else {
                    setInvestments([]);
                }
            } catch (err) {
                // If 401, let the global interceptor handle redirect
                if (err.response?.status !== 401) {
                    setError(err.message || "An unexpected error occurred");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Dynamic stats derived from real investment data
    const stats = useMemo(() => {
        const safeInvestments = Array.isArray(investments) ? investments : [];
        if (safeInvestments.length === 0) {
            return {
                totalInvested: "0.00",
                portfolioValue: "0.00",
                portfolioGrowth: "0.0",
                totalReturns: "0",
                avgROI: "0.0",
                activeDealsCount: 0,
                completedDealsCount: 0,
                riskScore: "—",
            };
        }

        // Total loan amount (outstanding debt) in millions — real backend field
        const totalDebt = safeInvestments.reduce((acc, inv) => acc + (inv?.loanAmount || 0), 0);
        const totalPropertyValue = safeInvestments.reduce((acc, inv) => acc + (inv?.propertyValue || 0), 0);

        // Annual expected returns = sum of (loanAmount * returnRate / 100) using real interest_rate
        const totalAnnualReturn = safeInvestments.reduce((acc, inv) => {
            const principal = inv?.loanAmount || 0;
            const rate = inv?.returnRate || 0;
            return acc + (principal * rate / 100);
        }, 0);

        const avgROI = totalDebt > 0 ? (totalAnnualReturn / totalDebt) * 100 : 0;

        const activeDealsCount = safeInvestments.filter(i => i?.status !== 'Sold' && i?.status !== 'Settled').length;
        const completedDealsCount = safeInvestments.filter(i => i?.status === 'Sold' || i?.status === 'Settled').length;

        // Portfolio growth = equity / debt (real fields: estimated_value - outstanding_debt)
        const totalEquity = Math.max(0, totalPropertyValue - totalDebt);
        const portfolioGrowth = totalDebt > 0 ? (totalEquity / totalDebt) * 100 : 0;

        // Average LVR across all investments (real field)
        const avgLvr = safeInvestments.length > 0
            ? (safeInvestments.reduce((acc, inv) => acc + (inv?.lvr || 0), 0) / safeInvestments.length).toFixed(1)
            : "—";

        return {
            totalInvested: (totalDebt / 1000000).toFixed(2),
            portfolioValue: (totalPropertyValue / 1000000).toFixed(2),
            portfolioGrowth: portfolioGrowth.toFixed(1),
            totalReturns: (totalAnnualReturn / 1000).toFixed(0),
            avgROI: avgROI.toFixed(1),
            activeDealsCount,
            completedDealsCount,
            riskScore: avgLvr,
        };
    }, [investments]);

    const performanceData = useMemo(() => {
        // Average holding period: days since each investment was created (real data)
        const now = Date.now();
        const avgDays = investments.length > 0
            ? Math.round(investments.reduce((acc, inv) => {
                const created = inv.created_at ? new Date(inv.created_at).getTime() : now;
                return acc + Math.ceil((now - created) / 86400000);
              }, 0) / investments.length)
            : 0;
        return {
            totalReturn: stats.totalReturns,
            avgROI: stats.avgROI,
            portfolioGrowth: stats.portfolioGrowth,
            holdingPeriod: avgDays.toString(),
            diversification: investments.length.toString(),
        };
    }, [stats, investments]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <>
        <div className="space-y-3 pb-6 animate-fade-in pt-1">
            <div className="pt-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-0">Welcome back, {firstName}</h1>
                <p className="text-slate-500 text-sm font-medium leading-tight">Real-time performance metrics and active investment opportunities</p>
            </div>

            {/* Hero Section */}
            <InvestorPortfolioHero stats={stats} />

            {/* Performance Metrics Section */}
            <InvestorPerformanceCards data={performanceData} />

            {/* Alerts / Opportunities */}
            <InvestorAlerts investments={investments} />

            {/* Main Content & Sidebar Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3">
                    <InvestorActiveInvestments investments={investments} />
                </div>
                <div className="xl:col-span-1">
                    <InvestorSidebarWidgets stats={stats} investments={investments} />
                </div>
            </div>

            {/* Help Bar */}
            <div className="flex items-center justify-between bg-slate-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-sm text-slate-500">Need assistance? Our support team is here to help.</p>
                <div className="flex gap-2">
                    <button type="button" onClick={() => setShowSupportModal(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors">Support Resources</button>
                    <button type="button" onClick={() => setShowContactModal(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">Contact Support</button>
                </div>
            </div>
        </div>

        {/* Support Resources Modal */}
        {showSupportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSupportModal(false)}>
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-slate-800">Support Resources</h3>
                        <button onClick={() => setShowSupportModal(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                        {[
                            { name: "ASIC MoneySmart", phone: "1300 300 630", url: "https://moneysmart.gov.au" },
                            { name: "National Debt Helpline", phone: "1800 007 007", url: "https://ndh.org.au" },
                            { name: "AFCA", phone: "1800 931 678", url: "https://afca.org.au" },
                            { name: "Legal Aid NSW", phone: "1300 888 529", url: "https://legalaid.nsw.gov.au" },
                            { name: "Fair Trading NSW", phone: "13 32 20", url: "https://fairtrading.nsw.gov.au" },
                        ].map((r) => (
                            <div key={r.name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                <div>
                                    <p className="text-xs font-medium text-slate-700">{r.name}</p>
                                    <p className="text-xs text-slate-400">{r.phone}</p>
                                </div>
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-medium">Visit</a>
                            </div>
                        ))}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100">
                        <button onClick={() => setShowSupportModal(false)} className="w-full text-xs font-semibold py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}

        {/* Contact Support Modal */}
        {showContactModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowContactModal(false)}>
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-slate-800">Contact Support</h3>
                        <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                        {[
                            { label: "Email", value: "support@briqbanq.com.au" },
                            { label: "Debt Helpline", value: "1800 007 007" },
                            { label: "AFCA Complaints", value: "1800 931 678" },
                        ].map((c) => (
                            <div key={c.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <p className="text-xs text-slate-500">{c.label}</p>
                                <p className="text-xs font-semibold text-slate-700">{c.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100">
                        <button onClick={() => setShowContactModal(false)} className="w-full text-xs font-semibold py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
