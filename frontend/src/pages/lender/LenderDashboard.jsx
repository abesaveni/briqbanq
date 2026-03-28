import React, { useState, useEffect, useMemo } from "react";
import LenderHeroSection from "../../components/lender_dashboard/LenderHeroSection";
import LenderAlerts from "../../components/lender_dashboard/LenderAlerts";
import LenderMetricsGrid from "../../components/lender_dashboard/LenderMetricsGrid";
import LenderPortfolioTable from "../../components/lender_dashboard/LenderPortfolioTable";
import LenderRecentActivity from "../../components/lender_dashboard/LenderRecentActivity";
import LenderQuickActions from "../../components/lender_dashboard/LenderQuickActions";
import { useAuth } from "../../context/AuthContext";
import { lenderService } from "../../api/dataService";

export default function LenderDashboard() {
    const { user } = useAuth();
    const firstName = user?.firstName || (user?.name || "").split(' ')[0] || "User";
    const [cases, setCases] = useState([]);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);

    useEffect(() => {
        const fetchCases = async () => {
            try {
                const res = await lenderService.getMyCases();
                if (res.success) {
                    setCases(Array.isArray(res.data) ? res.data : []);
                }
            } catch (err) {
                console.error("Failed to fetch cases for dashboard stats", err);
            }
        };
        fetchCases();
    }, []);

    const lenderStats = useMemo(() => {
        if (!cases || cases.length === 0) {
            return {
                portfolioValue: "0",
                activeLoans: 0,
                recoveryRate: "0.0",
                interestEarned: "0.00",
                defaultRate: "0.0",
                activeBids: "0",
                lvr: "0.0",
            };
        }

        const totalValuation = cases.reduce((acc, c) => acc + (Number(c.estimated_value) || Number(c.valuation) || 0), 0);
        const totalLoanAmount = cases.reduce((acc, c) => acc + (Number(c.outstanding_debt) || Number(c.loanAmount) || 0), 0);

        const activeLoansCount = cases.filter(c => !['CLOSED', 'REJECTED'].includes(c.status)).length;

        const lvrValue = totalValuation > 0 ? (totalLoanAmount / totalValuation) * 100 : 0;
        const interest = totalLoanAmount * 0.052; // Approximate 5.2% interest

        const formatMoney = (val) => {
            if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
            if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
            return val.toFixed(0);
        };

        const closedCases = cases.filter(c => c.status === 'CLOSED').length;
        const recoveryRateVal = cases.length > 0 ? ((closedCases / cases.length) * 100).toFixed(1) : '0.0';
        const defaultCases = cases.filter(c => c.status === 'REJECTED').length;
        const defaultRateVal = cases.length > 0 ? ((defaultCases / cases.length) * 100).toFixed(1) : '0.0';
        const activeBidsVal = cases.filter(c => ['AUCTION', 'LISTED'].includes(c.status)).length;

        return {
            portfolioValue: formatMoney(totalValuation),
            activeLoans: activeLoansCount,
            recoveryRate: recoveryRateVal.toString(),
            interestEarned: formatMoney(interest),
            defaultRate: defaultRateVal.toString(),
            activeBids: activeBidsVal.toString(),
            lvr: lvrValue.toFixed(1)
        };
    }, [cases]);

    return (
        <>
        <div className="space-y-3 pb-6 animate-fade-in pt-1">
            <div className="pt-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-0">Welcome back, {firstName}</h1>
                <p className="text-gray-500 text-[13px] font-medium leading-tight">Manage defaulted loans and auctions</p>
            </div>

            {/* Lender Command Center (Hero) */}
            <LenderHeroSection statsData={lenderStats} />

            {/* Alerts Section (Compliance & Market) */}
            <LenderAlerts />

            {/* Secondary Metrics Grid */}
            <LenderMetricsGrid statsData={lenderStats} />

            {/* Portfolio and Sidebar Section */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Main Table Area - 8 Columns */}
                <div className="xl:col-span-8 h-full">
                    <LenderPortfolioTable />
                </div>

                {/* Sidebar Area - 4 Columns */}
                <div className="xl:col-span-4 h-full flex flex-col gap-8">
                    <LenderRecentActivity />
                    <LenderQuickActions />
                </div>
            </div>

            {/* Help Bar */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <p className="text-sm text-slate-500">Need assistance? Our support team is here to help.</p>
                <div className="flex gap-2">
                    <button type="button" onClick={() => setShowSupportModal(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors">Support Resources</button>
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
